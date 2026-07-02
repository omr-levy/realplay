import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TournamentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('tournament-snapshot') private readonly snapshotQueue: Queue,
  ) {}

  async create(dto: CreateTournamentDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const status =
      startsAt <= new Date() ? TournamentStatus.ACTIVE : TournamentStatus.PENDING;

    const tournament = await this.prisma.tournament.create({
      data: { name: dto.name, startsAt, endsAt, status },
    });

    const startsAtMs = startsAt.getTime();
    const endsAtMs = endsAt.getTime();

    await this.redis.client.zadd(
      this.redis.keys.active(),
      endsAtMs,
      tournament.id,
    );
    await this.redis.client.hset(this.redis.keys.meta(tournament.id), {
      startsAt: startsAtMs,
      endsAt: endsAtMs,
    });

    // Grace period after endsAt before the snapshot job finalizes results,
    // giving in-flight bets (createdAt in-window but arriving slightly late)
    // a chance to still land — see README "Known limitations".
    const graceMs = process.env.FINALIZE_GRACE_MS
      ? Number(process.env.FINALIZE_GRACE_MS)
      : 5000;

    await this.snapshotQueue.add(
      'finalize',
      { tournamentId: tournament.id },
      { delay: Math.max(endsAtMs + graceMs - Date.now(), 0) },
    );

    return tournament;
  }

  async getLeaderboard(id: string, query: LeaderboardQueryDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const { limit, offset } = query;

    if (tournament.status === TournamentStatus.FINALIZED) {
      const [data, total] = await Promise.all([
        this.prisma.tournamentResult.findMany({
          where: { tournamentId: id },
          orderBy: { rank: 'asc' },
          skip: offset,
          take: limit,
          select: { rank: true, playerId: true, finalScore: true },
        }),
        this.prisma.tournamentResult.count({ where: { tournamentId: id } }),
      ]);
      return { data, total };
    }

    const raw = await this.redis.client.zrevrange(
      this.redis.keys.leaderboard(id),
      offset,
      offset + limit - 1,
      'WITHSCORES',
    );

    const data = [];
    for (let i = 0; i < raw.length; i += 2) {
      data.push({
        rank: offset + i / 2 + 1,
        playerId: raw[i],
        score: Number(raw[i + 1]),
      });
    }

    const total = await this.redis.client.zcard(
      this.redis.keys.leaderboard(id),
    );

    return { data, total };
  }
}

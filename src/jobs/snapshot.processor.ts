import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Processor('tournament-snapshot')
export class SnapshotProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<{ tournamentId: string }>) {
    const { tournamentId } = job.data;

    const raw = await this.redis.client.zrevrange(
      this.redis.keys.leaderboard(tournamentId),
      0,
      -1,
      'WITHSCORES',
    );

    const rows = [];
    for (let i = 0; i < raw.length; i += 2) {
      rows.push({
        tournamentId,
        playerId: raw[i],
        finalScore: Number(raw[i + 1]),
        rank: i / 2 + 1,
      });
    }

    await this.prisma.$transaction([
      this.prisma.tournamentResult.createMany({
        data: rows,
        skipDuplicates: true,
      }),
      this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'FINALIZED' },
      }),
    ]);

    await this.redis.client.zrem(this.redis.keys.active(), tournamentId);
  }
}

import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateBetDto } from './dto/create-bet.dto';

@Injectable()
export class BetsService {
  constructor(private readonly redis: RedisService) {}

  async ingest(dto: CreateBetDto) {
    // currency is validated but not used in scoring — single-currency (USD) system assumed
    const createdAtMs = new Date(dto.createdAt).getTime();

    // Candidates whose endsAt >= createdAt. Note: a tournament already
    // finalized by the snapshot job (Part 4) has been removed from this set.
    // The job is delayed by FINALIZE_GRACE_MS past endsAt specifically so
    // in-flight bets have a window to still land here; a bet that arrives
    // later than that grace period is silently dropped — known gap, out of scope.
    const candidateIds = await this.redis.client.zrangebyscore(
      this.redis.keys.active(),
      createdAtMs,
      '+inf',
    );

    const matchedIds: string[] = [];
    for (const tournamentId of candidateIds) {
      const meta = await this.redis.client.hgetall(
        this.redis.keys.meta(tournamentId),
      );
      if (meta.startsAt && Number(meta.startsAt) <= createdAtMs) {
        matchedIds.push(tournamentId);
      }
    }

    for (const tournamentId of matchedIds) {
      const isNew = await this.redis.client.sadd(
        this.redis.keys.seenBets(tournamentId),
        dto.externalBetId,
      );
      if (isNew) {
        await this.redis.client.zincrby(
          this.redis.keys.leaderboard(tournamentId),
          dto.amount,
          dto.playerId,
        );
      }
    }

    return { status: 'accepted' };
  }
}

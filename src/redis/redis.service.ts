import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

export const keys = {
  active: () => 'tournaments:active',
  meta: (tournamentId: string) => `tournament:${tournamentId}:meta`,
  leaderboard: (tournamentId: string) =>
    `tournament:${tournamentId}:leaderboard`,
  seenBets: (tournamentId: string) => `tournament:${tournamentId}:seen-bets`,
};

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;
  readonly keys = keys;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    });
  }

  async onModuleInit() {
    await this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

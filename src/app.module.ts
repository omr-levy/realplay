import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { BetsModule } from './bets/bets.module';
import { SnapshotQueueModule } from './jobs/snapshot-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    }),
    PrismaModule,
    RedisModule,
    TournamentsModule,
    BetsModule,
    SnapshotQueueModule,
  ],
})
export class AppModule {}

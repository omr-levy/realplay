import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SnapshotProcessor } from './snapshot.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'tournament-snapshot' })],
  providers: [SnapshotProcessor],
})
export class SnapshotQueueModule {}

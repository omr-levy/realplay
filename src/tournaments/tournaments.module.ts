import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'tournament-snapshot' })],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('TournamentsService', () => {
  let service: TournamentsService;
  let prisma: { tournament: { findUnique: jest.Mock } };
  let redis: {
    client: { zrevrange: jest.Mock; zcard: jest.Mock };
    keys: Pick<RedisService['keys'], 'leaderboard'>;
  };

  beforeEach(async () => {
    prisma = {
      tournament: { findUnique: jest.fn() },
    };
    redis = {
      client: {
        zrevrange: jest.fn(),
        zcard: jest.fn(),
      },
      keys: {
        leaderboard: (id: string) => `tournament:${id}:leaderboard`,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        {
          provide: getQueueToken('tournament-snapshot'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TournamentsService);
  });

  it('returns players sorted DESC by score for an active tournament', async () => {
    prisma.tournament.findUnique.mockResolvedValue({
      id: 't1',
      status: 'ACTIVE',
    });
    redis.client.zrevrange.mockResolvedValue([
      'player_3',
      '900',
      'player_1',
      '500',
      'player_2',
      '300',
    ]);
    redis.client.zcard.mockResolvedValue(3);

    const result = await service.getLeaderboard('t1', {
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual({
      data: [
        { rank: 1, playerId: 'player_3', score: 900 },
        { rank: 2, playerId: 'player_1', score: 500 },
        { rank: 3, playerId: 'player_2', score: 300 },
      ],
      total: 3,
    });
  });
});

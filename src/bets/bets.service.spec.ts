import { Test, TestingModule } from '@nestjs/testing';
import { BetsService } from './bets.service';
import { RedisService } from '../redis/redis.service';
import { CreateBetDto } from './dto/create-bet.dto';

describe('BetsService', () => {
  let service: BetsService;
  let redis: {
    client: {
      zrangebyscore: jest.Mock;
      hgetall: jest.Mock;
      sadd: jest.Mock;
      zincrby: jest.Mock;
    };
    keys: RedisService['keys'];
  };

  const dto: CreateBetDto = {
    externalBetId: 'bet_123456',
    playerId: 'player_42',
    amount: 250,
    currency: 'USD',
    createdAt: '2026-06-04T12:30:00.000Z',
  };

  beforeEach(async () => {
    redis = {
      client: {
        zrangebyscore: jest.fn().mockResolvedValue(['tourn_1']),
        hgetall: jest.fn().mockResolvedValue({ startsAt: '0', endsAt: '9999999999999' }),
        sadd: jest.fn(),
        zincrby: jest.fn(),
      },
      keys: {
        active: () => 'tournaments:active',
        meta: (id: string) => `tournament:${id}:meta`,
        leaderboard: (id: string) => `tournament:${id}:leaderboard`,
        seenBets: (id: string) => `tournament:${id}:seen-bets`,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BetsService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = module.get(BetsService);
  });

  it('accepts a valid bet in the tournament window and increments the score', async () => {
    redis.client.sadd.mockResolvedValue(1);

    const result = await service.ingest(dto);

    expect(result).toEqual({ status: 'accepted' });
    expect(redis.client.sadd).toHaveBeenCalledWith(
      'tournament:tourn_1:seen-bets',
      'bet_123456',
    );
    expect(redis.client.zincrby).toHaveBeenCalledWith(
      'tournament:tourn_1:leaderboard',
      250,
      'player_42',
    );
  });

  it('does not increment the score again for a duplicate externalBetId', async () => {
    redis.client.sadd.mockResolvedValue(0);

    const result = await service.ingest(dto);

    expect(result).toEqual({ status: 'accepted' });
    expect(redis.client.zincrby).not.toHaveBeenCalled();
  });
});

import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
export declare class TournamentsService {
    private readonly prisma;
    private readonly redis;
    private readonly snapshotQueue;
    constructor(prisma: PrismaService, redis: RedisService, snapshotQueue: Queue);
    create(dto: CreateTournamentDto): Promise<{
        id: string;
        name: string;
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.TournamentStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getLeaderboard(id: string, query: LeaderboardQueryDto): Promise<{
        data: {
            playerId: string;
            finalScore: number;
            rank: number;
        }[];
        total: number;
    } | {
        data: {
            rank: number;
            playerId: string;
            score: number;
        }[];
        total: number;
    }>;
}

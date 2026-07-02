import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
export declare const keys: {
    active: () => string;
    meta: (tournamentId: string) => string;
    leaderboard: (tournamentId: string) => string;
    seenBets: (tournamentId: string) => string;
};
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    readonly client: Redis;
    readonly keys: {
        active: () => string;
        meta: (tournamentId: string) => string;
        leaderboard: (tournamentId: string) => string;
        seenBets: (tournamentId: string) => string;
    };
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}

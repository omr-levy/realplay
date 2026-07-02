"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let TournamentsService = class TournamentsService {
    constructor(prisma, redis, snapshotQueue) {
        this.prisma = prisma;
        this.redis = redis;
        this.snapshotQueue = snapshotQueue;
    }
    async create(dto) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (endsAt <= startsAt) {
            throw new common_1.BadRequestException('endsAt must be after startsAt');
        }
        const status = startsAt <= new Date() ? client_1.TournamentStatus.ACTIVE : client_1.TournamentStatus.PENDING;
        const tournament = await this.prisma.tournament.create({
            data: { name: dto.name, startsAt, endsAt, status },
        });
        const startsAtMs = startsAt.getTime();
        const endsAtMs = endsAt.getTime();
        await this.redis.client.zadd(this.redis.keys.active(), endsAtMs, tournament.id);
        await this.redis.client.hset(this.redis.keys.meta(tournament.id), {
            startsAt: startsAtMs,
            endsAt: endsAtMs,
        });
        const graceMs = process.env.FINALIZE_GRACE_MS
            ? Number(process.env.FINALIZE_GRACE_MS)
            : 5000;
        await this.snapshotQueue.add('finalize', { tournamentId: tournament.id }, { delay: Math.max(endsAtMs + graceMs - Date.now(), 0) });
        return tournament;
    }
    async getLeaderboard(id, query) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        const { limit, offset } = query;
        if (tournament.status === client_1.TournamentStatus.FINALIZED) {
            const [data, total] = await Promise.all([
                this.prisma.tournamentResult.findMany({
                    where: { tournamentId: id },
                    orderBy: { rank: 'asc' },
                    skip: offset,
                    take: limit,
                    select: { rank: true, playerId: true, finalScore: true },
                }),
                this.prisma.tournamentResult.count({ where: { tournamentId: id } }),
            ]);
            return { data, total };
        }
        const raw = await this.redis.client.zrevrange(this.redis.keys.leaderboard(id), offset, offset + limit - 1, 'WITHSCORES');
        const data = [];
        for (let i = 0; i < raw.length; i += 2) {
            data.push({
                rank: offset + i / 2 + 1,
                playerId: raw[i],
                score: Number(raw[i + 1]),
            });
        }
        const total = await this.redis.client.zcard(this.redis.keys.leaderboard(id));
        return { data, total };
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('tournament-snapshot')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_2.Queue])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map
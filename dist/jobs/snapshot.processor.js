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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let SnapshotProcessor = class SnapshotProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, redis) {
        super();
        this.prisma = prisma;
        this.redis = redis;
    }
    async process(job) {
        const { tournamentId } = job.data;
        const raw = await this.redis.client.zrevrange(this.redis.keys.leaderboard(tournamentId), 0, -1, 'WITHSCORES');
        const rows = [];
        for (let i = 0; i < raw.length; i += 2) {
            rows.push({
                tournamentId,
                playerId: raw[i],
                finalScore: Number(raw[i + 1]),
                rank: i / 2 + 1,
            });
        }
        await this.prisma.$transaction([
            this.prisma.tournamentResult.createMany({
                data: rows,
                skipDuplicates: true,
            }),
            this.prisma.tournament.update({
                where: { id: tournamentId },
                data: { status: 'FINALIZED' },
            }),
        ]);
        await this.redis.client.zrem(this.redis.keys.active(), tournamentId);
    }
};
exports.SnapshotProcessor = SnapshotProcessor;
exports.SnapshotProcessor = SnapshotProcessor = __decorate([
    (0, bullmq_1.Processor)('tournament-snapshot'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], SnapshotProcessor);
//# sourceMappingURL=snapshot.processor.js.map
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
exports.BetsService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let BetsService = class BetsService {
    constructor(redis) {
        this.redis = redis;
    }
    async ingest(dto) {
        const createdAtMs = new Date(dto.createdAt).getTime();
        const candidateIds = await this.redis.client.zrangebyscore(this.redis.keys.active(), createdAtMs, '+inf');
        const matchedIds = [];
        for (const tournamentId of candidateIds) {
            const meta = await this.redis.client.hgetall(this.redis.keys.meta(tournamentId));
            if (meta.startsAt && Number(meta.startsAt) <= createdAtMs) {
                matchedIds.push(tournamentId);
            }
        }
        for (const tournamentId of matchedIds) {
            const isNew = await this.redis.client.sadd(this.redis.keys.seenBets(tournamentId), dto.externalBetId);
            if (isNew) {
                await this.redis.client.zincrby(this.redis.keys.leaderboard(tournamentId), dto.amount, dto.playerId);
            }
        }
        return { status: 'accepted' };
    }
};
exports.BetsService = BetsService;
exports.BetsService = BetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], BetsService);
//# sourceMappingURL=bets.service.js.map
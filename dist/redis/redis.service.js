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
exports.RedisService = exports.keys = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
exports.keys = {
    active: () => 'tournaments:active',
    meta: (tournamentId) => `tournament:${tournamentId}:meta`,
    leaderboard: (tournamentId) => `tournament:${tournamentId}:leaderboard`,
    seenBets: (tournamentId) => `tournament:${tournamentId}:seen-bets`,
};
let RedisService = class RedisService {
    constructor() {
        this.keys = exports.keys;
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        });
    }
    async onModuleInit() {
        await this.client.ping();
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map
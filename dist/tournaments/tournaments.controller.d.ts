import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
export declare class TournamentsController {
    private readonly tournamentsService;
    constructor(tournamentsService: TournamentsService);
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

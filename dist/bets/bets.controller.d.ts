import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
export declare class BetsController {
    private readonly betsService;
    constructor(betsService: BetsService);
    create(dto: CreateBetDto): Promise<{
        status: string;
    }>;
}

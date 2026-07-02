import { RedisService } from '../redis/redis.service';
import { CreateBetDto } from './dto/create-bet.dto';
export declare class BetsService {
    private readonly redis;
    constructor(redis: RedisService);
    ingest(dto: CreateBetDto): Promise<{
        status: string;
    }>;
}

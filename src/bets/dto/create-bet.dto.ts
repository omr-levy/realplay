import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateBetDto {
  @IsString()
  @IsNotEmpty()
  externalBetId: string;

  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsISO8601()
  createdAt: string;
}

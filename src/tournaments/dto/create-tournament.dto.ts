import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}

import { IsEnum, IsInt, Min } from 'class-validator';
import { FixtureResult } from '../entities/event.entity';

export class RecordFixtureResultDto {
  @IsInt()
  @Min(0)
  our_score: number;

  @IsInt()
  @Min(0)
  opponent_score: number;

  @IsEnum(FixtureResult)
  result: FixtureResult;
}

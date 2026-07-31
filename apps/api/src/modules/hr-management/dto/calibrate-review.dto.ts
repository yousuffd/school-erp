import { IsInt, Max, Min } from 'class-validator';

export class CalibrateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  calibrated_rating: number;
}
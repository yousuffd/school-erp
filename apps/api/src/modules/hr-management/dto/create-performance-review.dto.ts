import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ReviewerType } from '../entities/performance-review.entity';
import { IsEnum } from 'class-validator';

export class CreatePerformanceReviewDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  cycle_id: string;

  @IsUUID()
  employee_id: string;

  @IsUUID()
  reviewer_id: string;

  @IsEnum(ReviewerType)
  reviewer_type: ReviewerType;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comments?: string;
}
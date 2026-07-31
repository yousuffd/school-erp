import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  @Max(9999)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

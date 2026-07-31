import { IsDateString, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReviewCycleDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  cycle_name: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
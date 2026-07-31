import { IsEnum } from 'class-validator';
import { JobOpeningStatus } from '../entities/job-opening.entity';

export class UpdateJobOpeningStatusDto {
  @IsEnum(JobOpeningStatus)
  status: JobOpeningStatus;
}
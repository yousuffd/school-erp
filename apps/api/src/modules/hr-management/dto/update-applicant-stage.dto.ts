import { IsEnum } from 'class-validator';
import { ApplicantStage } from '../entities/applicant.entity';

export class UpdateApplicantStageDto {
  @IsEnum(ApplicantStage)
  stage: ApplicantStage;
}
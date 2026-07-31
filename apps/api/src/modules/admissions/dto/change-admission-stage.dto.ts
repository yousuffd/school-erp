import { IsEnum } from 'class-validator';
import { AdmissionStage } from '../entities/admission.entity';

export class ChangeAdmissionStageDto {
  @IsEnum(AdmissionStage)
  stage: AdmissionStage;
}

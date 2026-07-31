import { IsDateString, IsEnum, IsUUID } from 'class-validator';
import { CertificateType } from '../entities/certificate.entity';

export class CreateCertificateDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsEnum(CertificateType)
  certificate_type: CertificateType;

  @IsDateString()
  issued_date: string;
}

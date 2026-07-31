import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateHostelVisitorDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsString()
  @MaxLength(150)
  visitor_name: string;

  @IsString()
  @MaxLength(100)
  relation: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  id_proof_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  id_proof_number?: string;

  @IsDateString()
  check_in_time: string;
}
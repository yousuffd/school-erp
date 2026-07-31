import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EnrollAdmissionDto {
  /** Assigned at the point of enrollment — the natural real-world moment a school hands out a formal admission number. */
  @IsString()
  @MaxLength(40)
  admission_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;
}

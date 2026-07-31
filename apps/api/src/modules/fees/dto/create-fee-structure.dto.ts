import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumberString,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class FeeComponentInput {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumberString()
  amount: string;
}

class FeeInstallmentInput {
  @IsString()
  @MaxLength(60)
  label: string;

  @IsDateString()
  due_date: string;

  @IsNumberString()
  amount: string;
}

export class CreateFeeStructureDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MaxLength(40)
  grade_level: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeeComponentInput)
  components: FeeComponentInput[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeeInstallmentInput)
  installments: FeeInstallmentInput[];
}

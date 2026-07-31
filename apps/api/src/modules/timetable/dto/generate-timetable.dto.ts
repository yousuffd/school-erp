import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '../entities/timetable-slot.entity';

export class TimetableRequirementDto {
  @IsUUID()
  school_class_id: string;

  @IsUUID()
  subject_id: string;

  @IsUUID()
  teacher_id: string;

  /** How many periods/week this class needs of this subject, taught by this teacher. */
  @IsInt()
  @Min(1)
  @Max(12)
  periods_per_week: number;
}

export class GenerateTimetableDto {
  @IsUUID()
  tenant_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimetableRequirementDto)
  requirements: TimetableRequirementDto[];

  /** Defaults to Mon-Fri in the service if omitted. */
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days?: DayOfWeek[];

  /** Defaults to 8 in the service if omitted. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  periods_per_day?: number;
}

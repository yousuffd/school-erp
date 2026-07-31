import { IsEnum, IsOptional, IsString, IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { DiaryEntryScope, DiaryEntryCategory } from '../entities/diary-entry.entity';

export class CreateDiaryEntryDto {
  // Required for Teacher/Admin callers, validated in the service — omitted
  // entirely by a Parent caller, whose class_id is always derived
  // server-side from the linked student's real class (see DiaryService.create).
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsEnum(DiaryEntryScope)
  scope: DiaryEntryScope;

  @IsOptional()
  @IsUUID()
  student_id?: string; // required when scope === 'student' — validated in service

  @IsOptional()
  @IsEnum(DiaryEntryCategory)
  category?: DiaryEntryCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsDateString()
  entry_date?: string;
}

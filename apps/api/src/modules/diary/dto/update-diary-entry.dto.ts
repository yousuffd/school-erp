import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { DiaryEntryCategory } from '../entities/diary-entry.entity';

export class UpdateDiaryEntryDto {
  @IsOptional()
  @IsEnum(DiaryEntryCategory)
  category?: DiaryEntryCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}

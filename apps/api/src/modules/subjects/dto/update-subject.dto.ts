import { IsOptional, IsString } from 'class-validator';

// VERIFY against the real create-subject.dto.ts (not shown to me) that
// this covers the same editable fields — in particular confirm the exact
// field name/type used for `code` there, and add any other Subject fields
// that should be PATCH-able (this only covers name/code/elective_group).
export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  elective_group?: string | null;
}

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDiscussionThreadDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  subject_id: string;

  @IsUUID()
  school_class_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MaxLength(150)
  title: string;
}

export class CreateDiscussionPostDto {
  @IsString()
  @MinLength(1)
  content: string;
}

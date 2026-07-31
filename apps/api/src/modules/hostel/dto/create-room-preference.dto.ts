import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoomPreferenceDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsUUID()
  preferred_roommate_id?: string;

  @IsOptional()
  @IsInt()
  preferred_floor?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
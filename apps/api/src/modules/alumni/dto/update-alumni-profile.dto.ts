import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAlumniProfileDto {
  @IsOptional() @IsString() @MaxLength(150) current_occupation?: string;
  @IsOptional() @IsString() @MaxLength(150) current_employer?: string;
  @IsOptional() @IsString() @MaxLength(100) current_city?: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @IsString() @MaxLength(32) contact_phone?: string;
  @IsOptional() @IsString() @MaxLength(300) linkedin_url?: string;
  @IsOptional() @IsString() bio?: string;
}

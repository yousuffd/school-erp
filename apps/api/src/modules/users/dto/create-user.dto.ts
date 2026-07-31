import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  tenant_id: string;

  @IsOptional()
  @IsUUID()
  campus_id?: string;

  @IsUUID()
  role_id: string;

  /**
   * Set when this login is being provisioned FOR an existing Student record
   * (real self-service login, as opposed to Admin/Teacher/etc. accounts,
   * which never set this). The service layer enforces that a student can
   * only ever have one linked login — see UsersService.create().
   */
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  /** Only used for auth_provider = local; SSO users are provisioned via IdP claims. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Optional (see SUPER_ADMIN_DASHBOARD_SCOPE.md §4a). Every normal
   * tenant-scoped user must send it — omitting it is exclusively the
   * platform-level Super Admin login path, which AuthService routes to a
   * dedicated lookup that requires the matched user to actually be
   * Super Admin regardless of what's typed here.
   */
  @IsOptional()
  @IsString()
  @MaxLength(63)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'subdomain may only contain lowercase letters, numbers, and hyphens',
  })
  subdomain?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

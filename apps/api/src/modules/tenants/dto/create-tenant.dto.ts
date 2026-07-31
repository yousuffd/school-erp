import { IsArray, IsEmail, IsEnum, IsHexColor, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PlanTier } from '../../billing/entities/tenant-subscription.entity';

export class CreateTenantDto {
  @IsString()
  @MaxLength(200)
  school_name: string;

  @IsString()
  @MaxLength(63)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'subdomain may only contain lowercase letters, numbers, and hyphens',
  })
  subdomain: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsHexColor()
  primary_color?: string;

  @IsString()
  @MaxLength(200)
  first_admin_name: string;

  @IsEmail()
  first_admin_email: string;

  @IsString()
  @MinLength(8)
  first_admin_password: string;

  /**
   * Modules the provisioning Super Admin wants OFF for this school from
   * day one (e.g. a day school with no boarding doesn't need Hostel).
   * Creates a disabled TenantFeatureToggle row per entry — everything not
   * listed here stays enabled by default, same 'no row = enabled'
   * convention as every other feature toggle.
   */
  @IsOptional()
  @IsArray()
  @IsIn(['cafeteria', 'hostel', 'health-wellness'], { each: true })
  disabled_modules?: string[];

  /**
   * Required — every tenant must be provisioned onto a known tier from day
   * one (decided this session, see SUPER_ADMIN_DASHBOARD_SCOPE.md §5).
   * Existing tenants were retroactively backfilled onto 'starter' via
   * CreateBillingTables1785300000000; new tenants get this set explicitly
   * via TenantsService.provision() -> BillingService.createInitialSubscription().
   */
  @IsEnum(PlanTier)
  plan_tier: PlanTier;
}
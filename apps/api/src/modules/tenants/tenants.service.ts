import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';
import { SystemRoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { PayrollSettings } from '../payroll/entities/payroll-settings.entity';
import { TenantFeatureToggle } from '../feature-toggles/entities/tenant-feature-toggle.entity';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
  ) {}

  /**
   * Provisions a new tenant end-to-end (Phase 0 acceptance criterion #1):
   * tenant row + system roles + first School Admin login, all in one
   * transaction. Previously these three steps ran independently — a
   * failure partway through (as genuinely happened once during this fix's
   * own testing, on the RLS policy violation for the old per-tenant
   * Super Admin row) left an orphaned tenant with no roles and no admin,
   * silently "taking" the subdomain with nothing usable behind it. Wrapping
   * the whole thing in one transaction means any failure anywhere rolls
   * back completely — no more half-provisioned tenants.
   */
  async provision(dto: CreateTenantDto): Promise<{ tenant: Tenant; admin: User }> {
    const { first_admin_name, first_admin_email, first_admin_password, disabled_modules, ...tenantFields } = dto;

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Tenant, { where: { subdomain: dto.subdomain } });
      if (existing) {
        throw new ConflictException(`Subdomain '${dto.subdomain}' is already taken`);
      }

      const tenant = manager.create(Tenant, { ...tenantFields, status: TenantStatus.ACTIVE });
      const savedTenant = await manager.save(Tenant, tenant);

      const roles = await this.rolesService.seedSystemRolesForTenant(savedTenant.id, manager);
      const schoolAdminRole = roles.find((r) => r.name === SystemRoleName.SCHOOL_ADMIN);
      if (!schoolAdminRole) {
        throw new Error('School Admin role was not seeded correctly for the new tenant');
      }

      const admin = await this.usersService.create(
        {
          tenant_id: savedTenant.id,
          role_id: schoolAdminRole.id,
          name: first_admin_name,
          email: first_admin_email,
          password: first_admin_password,
        },
        savedTenant.id,
        manager,
      );

      // Payroll module (Blueprint Part 2, Module 11) expects every tenant to
      // have a settings row (professional_tax_amount) — see
      // PayrollSettingsService.findForTenant()'s doc comment, which flagged
      // this exact gap for tenants provisioned after the original seed
      // migration. Closing it here so it never recurs for new tenants.
      const payrollSettings = manager.create(PayrollSettings, {
        tenant_id: savedTenant.id,
        professional_tax_amount: '200',
      });
      await manager.save(PayrollSettings, payrollSettings);

      // Create a disabled toggle row for each module the provisioning admin
      // opted out of — see CreateTenantDto.disabled_modules doc comment.
      for (const featureKey of disabled_modules ?? []) {
        const toggle = manager.create(TenantFeatureToggle, {
          tenant_id: savedTenant.id,
          feature_key: featureKey,
          enabled: false,
        });
        await manager.save(TenantFeatureToggle, toggle);
      }

      // Initial subscription row — plan_tier is required on CreateTenantDto
      // (Phase B, SUPER_ADMIN_DASHBOARD_SCOPE.md §5). set_by is undefined
      // here since provision() doesn't currently receive the acting user's
      // id — the API-key bootstrap path has none at all, and the
      // authenticated-Super-Admin path could be threaded through later if
      // that attribution turns out to matter.
      await this.billingService.createInitialSubscription(
        savedTenant.id,
        dto.plan_tier,
        undefined,
        manager,
      );

      return { tenant: savedTenant, admin };
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  /**
   * Used by the login flow to resolve a subdomain (e.g. 'demo') to a real
   * tenant id — replaces requiring the raw tenant UUID on the login form,
   * which was accurate but genuinely hard to remember/type. Returns null
   * rather than throwing NotFoundException — AuthService.login() folds an
   * unknown subdomain into the same generic 'Invalid credentials' response
   * as a wrong password, rather than a distinguishable error that would
   * let a caller enumerate which subdomains exist.
   */
  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { subdomain } });
  }
}
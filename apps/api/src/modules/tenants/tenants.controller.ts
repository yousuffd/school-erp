import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantProvisioningGuard } from '../../common/guards/tenant-provisioning.guard';
import { getCurrentTenantId } from '../../common/context/tenant-context';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Previously @Public() with no @Permissions() at all — meaning ANY
   * request, authenticated or not, reached provision() unchecked. Real
   * enforcement now lives in TenantProvisioningGuard (see its doc comment
   * for the two ways through: a provisioning API key, for the no-session
   * bootstrap case, OR an authenticated Super Admin JWT, for the normal
   * ongoing onboarding case via ProvisionTenantPage). @Public() stays so
   * the global JwtAuthGuard/RbacGuard both correctly skip this route
   * (neither would know what to do with a request bearing only an API key
   * and no JWT) — TenantProvisioningGuard is the sole real gate here now.
   */
  @Post()
  @Public()
  @UseGuards(TenantProvisioningGuard)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.provision(dto);
  }

  @Get()
  @Permissions({ module: 'tenant-provisioning', action: 'view' })
  findAll() {
    return this.tenantsService.findAll();
  }

  /**
   * No @Permissions() — deliberately reachable by ANY authenticated tenant
   * user regardless of role (RbacGuard passes routes with no declared
   * permission requirement straight through, per its own comment: "route
   * didn't opt into RBAC checks"). Every role needs this — it's what
   * personalizes the sidebar header with the school's own name, not a
   * privileged operation.
   *
   * Derives the tenant from the JWT-verified request context
   * (getCurrentTenantId), never from a client-supplied id — same
   * never-trust-client-input-for-tenant-scoping rule as everywhere else.
   * Super Admin has no tenant (tenantId is null for them, correctly, not a
   * missing value) — explicitly rejected here rather than silently
   * returning someone else's data or a confusing 404.
   *
   * Declared BEFORE @Get(':id') — NestJS matches routes in declaration
   * order, so 'mine' would otherwise be swallowed by :id (treating "mine"
   * as the id param) if this came after it.
   */
  @Get('mine')
  async findMine() {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('No tenant context — this endpoint is for tenant users, not platform-level accounts.');
    }
    const tenant = await this.tenantsService.findOne(tenantId);
    // Only branding-safe fields — not the full tenant record (status,
    // subscription info, etc. shouldn't be broadly exposed to every role).
    return { school_name: tenant.school_name, logo_url: tenant.logo_url, primary_color: tenant.primary_color };
  }

  @Get(':id')
  @Permissions({ module: 'tenant-provisioning', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
}
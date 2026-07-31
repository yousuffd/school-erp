import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantProvisioningGuard } from '../../common/guards/tenant-provisioning.guard';

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

  @Get(':id')
  @Permissions({ module: 'tenant-provisioning', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
}

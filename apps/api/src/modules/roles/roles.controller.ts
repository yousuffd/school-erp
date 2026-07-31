import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions({ module: 'core-admin', action: 'view' })
  findAllForTenant(@Query('tenantId') tenantId: string) {
    return this.rolesService.findAllForTenant(tenantId);
  }

  @Get('modules')
  @Permissions({ module: 'core-admin', action: 'view' })
  getModules() {
    return this.rolesService.getAllModuleNames();
  }

  @Post()
  @Permissions({ module: 'core-admin', action: 'create' })
  createCustomRole(@Body('tenantId') tenantId: string, @Body('name') name: string) {
    return this.rolesService.createCustomRole(tenantId, name);
  }

  @Patch(':id/permissions')
  @Permissions({ module: 'core-admin', action: 'edit' })
  updatePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updatePermissions(id, dto);
  }

  
}

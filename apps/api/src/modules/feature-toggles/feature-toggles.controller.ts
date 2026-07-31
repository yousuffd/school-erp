import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { FeatureTogglesService } from './feature-toggles.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('feature-toggles')
export class FeatureTogglesController {
  constructor(private readonly service: FeatureTogglesService) {}

  @Get()
  @Permissions({ module: 'core-admin', action: 'view' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForTenant(user.tenantId);
  }

  @Patch(':featureKey')
  @Permissions({ module: 'core-admin', action: 'edit' })
  setToggle(
    @Param('featureKey') featureKey: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setToggle(user.tenantId, featureKey, enabled, user.userId);
  }
}
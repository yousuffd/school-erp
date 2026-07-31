
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import { FeatureTogglesService } from '../../modules/feature-toggles/feature-toggles.service';

@Injectable()
export class FeatureToggleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureTogglesService: FeatureTogglesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const featureKey = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!featureKey) return true; // route didn't opt into a feature check

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;


    const enabled = await this.featureTogglesService.isEnabled(user.tenantId, featureKey);
    if (!enabled) {
      throw new ForbiddenException(`This feature is currently disabled for your school.`);
    }
    return true;
  }
}
// apps/api/src/common/decorators/feature.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'requiresFeature';

/**
 * Declares which feature_key must be enabled for the caller's tenant to hit
 * a route. Hierarchical: @RequiresFeature('cafeteria.meal_attendance') is
 * blocked if EITHER 'cafeteria' or 'cafeteria.meal_attendance' is disabled.
 * Absence of this decorator = no feature check (route always allowed, same
 * default-pass convention as @Permissions() with no metadata).
 */
export const RequiresFeature = (featureKey: string) => SetMetadata(FEATURE_KEY, featureKey);
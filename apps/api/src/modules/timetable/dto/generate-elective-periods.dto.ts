import { IsUUID } from 'class-validator';

/**
 * Deliberately minimal — mirrors exactly what was done manually for
 * Greenwood (target 3 periods/week, every class in the tenant that has
 * elective offerings), now as a real, reusable, tenant-agnostic feature
 * instead of a one-off script. No configurable options were requested;
 * behavior is identical for every tenant, only the underlying data differs.
 */
export class GenerateElectivePeriodsDto {
  @IsUUID()
  tenant_id: string;
}

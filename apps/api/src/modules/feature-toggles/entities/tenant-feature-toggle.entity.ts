
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Day-2 operational config (NOT plan/billing gating — see design discussion).
 * Absence of a row for a given (tenant_id, feature_key) means enabled=true;
 * rows only need to exist to record an explicit override, almost always a
 * disable. feature_key is hierarchical dot-notation ("cafeteria",
 * "cafeteria.meal_attendance") — FeatureToggleGuard checks every ancestor
 * level, so disabling "cafeteria" implicitly disables its sub-features too.
 */
@Entity('tenant_feature_toggles')
@Unique(['tenant_id', 'feature_key'])
export class TenantFeatureToggle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  feature_key: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  updated_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
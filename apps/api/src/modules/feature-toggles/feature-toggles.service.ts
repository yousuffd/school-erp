import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantFeatureToggle } from './entities/tenant-feature-toggle.entity';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class FeatureTogglesService {
  constructor(
    @InjectRepository(TenantFeatureToggle)
    private readonly toggleRepo: Repository<TenantFeatureToggle>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private repo(): Repository<TenantFeatureToggle> {
    return scopedRepo(this.toggleRepo, TenantFeatureToggle);
  }

  private ancestorKeys(featureKey: string): string[] {
    const parts = featureKey.split('.');
    return parts.map((_, i) => parts.slice(0, i + 1).join('.'));
  }

  /**
   * Called from FeatureToggleGuard — Guards phase, same constraint as
   * RolesService.findOne(): no RLS-scoped connection exists yet, so this
   * opens its own short-lived connection + explicit transaction. Mirrors
   * that method's pattern exactly (see its comment for why both the
   * dedicated connection AND startTransaction() matter).
   */
  async isEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const keys = this.ancestorKeys(featureKey);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
      const rows = await queryRunner.manager
        .createQueryBuilder(TenantFeatureToggle, 't')
        .where('t.tenant_id = :tenantId', { tenantId })
        .andWhere('t.feature_key IN (:...keys)', { keys })
        .getMany();
      await queryRunner.commitTransaction();
      // Disabled if ANY matching row (this key or an ancestor) is explicitly off.
      return !rows.some((r) => r.enabled === false);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** For the Settings screen — runs post-Interceptor via a normal controller, so scopedRepo() is fine here. */
  async listForTenant(tenantId: string): Promise<TenantFeatureToggle[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  /**
   * Platform Super Admin's cross-tenant view (see
   * SUPER_ADMIN_LOGIN_SCOPE.md §4 / SUPER_ADMIN_DASHBOARD_SCOPE.md §2).
   * Deliberately does NOT reuse listForTenant()/scopedRepo() — the caller's
   * ambient RLS session is Super Admin's OWN (tenant_id: null → session
   * var ''), which has no relationship to the arbitrary tenantId being
   * inspected here. Using scopedRepo() would silently return zero rows for
   * every tenant (RLS blocks the mismatch), not the tenant's actual
   * toggles — a correctness bug, not a security one, but one that would
   * make every tenant's row look empty in the dashboard.
   *
   * Mirrors isEnabled()'s pattern: dedicated connection + explicit
   * transaction, session var set to the TARGET tenant's id (not the
   * caller's), read, commit. This is real cross-tenant access by a
   * platform-level account — legitimate here specifically because the
   * caller already passed @Permissions({module: 'platform-dashboard'}),
   * enforced by RbacGuard before this method is ever reached.
   */
  async listForTenantAsPlatformAdmin(tenantId: string): Promise<TenantFeatureToggle[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
      const rows = await queryRunner.manager
        .createQueryBuilder(TenantFeatureToggle, 't')
        .where('t.tenant_id = :tenantId', { tenantId })
        .getMany();
      await queryRunner.commitTransaction();
      return rows;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setToggle(
    tenantId: string,
    featureKey: string,
    enabled: boolean,
    updatedBy: string,
  ): Promise<TenantFeatureToggle> {
    let toggle = await this.repo().findOne({ where: { tenant_id: tenantId, feature_key: featureKey } });
    if (!toggle) {
      toggle = this.repo().create({ tenant_id: tenantId, feature_key: featureKey });
    }
    toggle.enabled = enabled;
    toggle.updated_by = updatedBy;
    return this.repo().save(toggle);
  }
}
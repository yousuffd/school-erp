import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role, SystemRoleName } from './entities/role.entity';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { PHASE_0_ROLE_PERMISSIONS } from './seed/phase0-permission-matrix';
import { PHASE_1_ROLE_PERMISSIONS } from './seed/phase1-permission-matrix';
import { PHASE_2_ROLE_PERMISSIONS } from './seed/phase2-permission-matrix';
import { PHASE_3_ROLE_PERMISSIONS } from './seed/phase3-permission-matrix';
import { scopedRepo } from '../../common/context/tenant-context';
import { PHASE_4_ROLE_PERMISSIONS } from './seed/phase4-permission-matrix';
import { PHASE_5_ROLE_PERMISSIONS } from './seed/phase5-permission-matrix';
import { EntityManager } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private repo(): Repository<Role> {
    return scopedRepo(this.roleRepo, Role);
  }

  /**
   * Called once at tenant provisioning time (see TenantsService.provision) — no
   * tenant context/RLS transaction exists yet at that point, so this always
   * uses the plain injected repo (scopedRepo falls back correctly on its own).
   * Merges every phase's permission matrix so far — new tenants provisioned
   * after Phase 3 shipped get Phase 0 through Phase 3 permissions from day one.
   * Tenants provisioned before a given module shipped need that module's
   * dedicated Backfill*RolePermissions migration to catch up (see
   * BackfillLmsRolePermissions / BackfillLibraryRolePermissions /
   * BackfillTransportationRolePermissions / BackfillHealthWellnessRolePermissions /
   * BackfillInventoryAssetsRolePermissions).
   *
   * Phase 3's matrix (phase3-permission-matrix.ts) now covers all Phase 3
   * modules combined in one file/one export — see that file's header for
   * why it started as several per-module files and was later consolidated.
   */
  async seedSystemRolesForTenant(tenantId: string, manager?: EntityManager): Promise<Role[]> {
  const rolesToSeed = Object.values(SystemRoleName).filter((name) => name !== SystemRoleName.SUPER_ADMIN);

  const permissionsByName: Record<string, any[]> = {};
  for (const name of rolesToSeed) {
    permissionsByName[name] = [
      ...PHASE_0_ROLE_PERMISSIONS[name],
      ...PHASE_1_ROLE_PERMISSIONS[name],
      ...PHASE_2_ROLE_PERMISSIONS[name],
      ...PHASE_3_ROLE_PERMISSIONS[name],
      ...PHASE_4_ROLE_PERMISSIONS[name],
      ...PHASE_5_ROLE_PERMISSIONS[name],
    ];
  }

  

  // If a manager is passed in (TenantsService.provision()'s transaction),
  // use it directly — no separate connection/transaction of our own,
  // since the caller's transaction already has app.current_tenant_id
  // set (see provision() and the RLS note below).
  if (manager) {
    await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    const roleEntities = rolesToSeed.map((name) =>
      manager.create(Role, { tenant_id: tenantId, name, is_system_role: true, permissions: permissionsByName[name] }),
    );
    return manager.save(Role, roleEntities);
  }

  // No manager provided — standalone dedicated-connection path, same as
  // before, for any caller outside a shared transaction.
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  let savedRoles: Role[];
  try {
    await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    const roleEntities = rolesToSeed.map((name) =>
      queryRunner.manager.create(Role, { tenant_id: tenantId, name, is_system_role: true, permissions: permissionsByName[name] }),
    );
    savedRoles = await queryRunner.manager.save(Role, roleEntities);
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
  return savedRoles;
}
  /**
   * Distinct module names across every phase's permission matrix, merged the
   * same way seedSystemRolesForTenant does it. This is the real source of
   * truth for "what modules exist" — the `permissions` table (Permission
   * entity) is never actually populated, so it can't be used for this.
   */
  getAllModuleNames(): string[] {
    const allMatrices = [
      PHASE_0_ROLE_PERMISSIONS,
      PHASE_1_ROLE_PERMISSIONS,
      PHASE_2_ROLE_PERMISSIONS,
      PHASE_3_ROLE_PERMISSIONS,
      PHASE_4_ROLE_PERMISSIONS,
      PHASE_5_ROLE_PERMISSIONS,
    ];
    const modules = new Set<string>();
    for (const matrix of allMatrices) {
      for (const perms of Object.values(matrix)) {
        for (const p of perms) modules.add(p.module);
      }
    }
    return Array.from(modules).sort();
  }

  
  async findAllForTenant(tenantId: string): Promise<Role[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  /**
   * `tenantId` is optional and exists specifically for the JwtStrategy /
   * AuthService.refresh() call sites (both happen during the Guards phase or
   * outside the Guards/Interceptor pipeline entirely — see each call site).
   *
   * IMPORTANT — this is NOT solved by adding an app-level WHERE clause alone.
   * `roles` has a real Postgres RLS policy. RLS is enforced by Postgres
   * itself, independently of whatever WHERE clause the query includes — if
   * no `app.current_tenant_id` session variable is set on the connection,
   * RLS hides every row regardless of what the app's own filter says. Since
   * TenantRlsInterceptor (which normally sets that session variable) is an
   * Interceptor, and NestJS runs Guards before Interceptors, no RLS-scoped
   * connection exists yet when this is called from JwtStrategy.
   *
   * So: when `tenantId !== undefined` (i.e. we have a definitive answer —
   * either a real tenant UUID, or null for the platform-level Super Admin),
   * this opens its own short-lived dedicated connection AND explicit
   * transaction (both matter — set_config's `is_local = true` flag only
   * persists for the duration of an actual transaction; without
   * startTransaction() here, the setting silently doesn't carry over to the
   * SELECT that follows, and RLS's own policy expression then fails trying
   * to cast an unset session var to uuid — the exact bug hit on the first
   * attempt at this fix, which had connect() + query(set_config) but no
   * startTransaction()).
   *
   * The session var is bound as `tenantId ?? ''`, never raw `tenantId` —
   * for a null tenantId (Super Admin), binding actual SQL NULL would make
   * current_setting() return NULL rather than '', and the RLS policy's
   * null-tenant branch specifically checks for '' — confirmed directly
   * against the live policy expression. `tenantId !== undefined` (rather
   * than the previous truthy `if (tenantId)`) is what makes this branch
   * actually run for the Super Admin case at all — a plain `if (tenantId)`
   * treats null and undefined identically, which would silently send a
   * Super Admin lookup down the ambient scopedRepo() fallback below
   * instead, with no explicit tenant filter and no RLS session var set.
   *
   * The not-found check happens AFTER commit, outside the try/catch — not
   * inside it. Throwing NotFoundException from inside the try block would
   * land in the catch clause and attempt rollbackTransaction() on a
   * transaction that had already been committed one line earlier, which
   * itself throws. Keep the DB work and the business-logic check as two
   * separate steps.
   *
   * The `OR tenant_id IS NULL` branch in the WHERE clause matters: the
   * platform Super Admin role has a NULL tenant_id (see
   * seedSystemRolesForTenant above) and must still resolve correctly.
   */
  async findOne(id: string, tenantId?: string | null): Promise<Role> {
    if (tenantId !== undefined) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let role: Role | null;
      try {
        await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId ?? '']);
        role = await queryRunner.manager
          .createQueryBuilder(Role, 'role')
          .where('role.id = :id', { id })
          .andWhere('(role.tenant_id = :tenantId OR role.tenant_id IS NULL)', { tenantId })
          .getOne();
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
      if (!role) throw new NotFoundException(`Role ${id} not found`);
      return role;
    }

    const role = await this.repo().findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async updatePermissions(id: string, dto: UpdateRolePermissionsDto): Promise<Role> {
    const role = await this.findOne(id);
    if (role.is_system_role) {
      // System roles' Phase-0 permission set is fixed by the matrix; tenants can still
      // create *custom* roles (kickoff §3 Role entity supports this) with their own sets.
      throw new NotFoundException(
        'System roles are managed centrally in Phase 0; create a custom role to customize permissions.',
      );
    }
    role.permissions = dto.permissions;
    return this.repo().save(role);
  }

  async createCustomRole(tenantId: string, name: string): Promise<Role> {
    const role = this.repo().create({
      tenant_id: tenantId,
      name,
      is_system_role: false,
      permissions: [],
    });
    return this.repo().save(role);
  }
}

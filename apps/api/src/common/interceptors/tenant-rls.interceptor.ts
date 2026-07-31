import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Observable, from, firstValueFrom } from 'rxjs';
import { tenantStorage, TenantContextStore } from '../context/tenant-context';

/**
 * Closes the RLS gap flagged since session 1: opens a dedicated DB connection
 * per request, sets the Postgres session var the RLS policies check
 * (`app.current_tenant_id`), and runs the whole request inside that
 * transaction. Public/pre-auth routes (tenant provisioning, login) have no
 * tenantId resolved yet and pass through untouched — those already do their
 * own explicit tenant_id filtering (see UsersService.findByEmailWithPassword).
 *
 * IMPORTANT: all commit/rollback/release logic lives inside ONE plain async
 * function (runWithRlsTransaction) rather than spread across rxjs operators
 * like tap()/finalize(). Those operators only accept synchronous callbacks —
 * handing them an async function silently drops the returned Promise, so any
 * error inside becomes an unhandled promise rejection, which crashes the
 * entire Node process by default (not just the one request). That's a real
 * bug an earlier version of this file had; this version awaits everything
 * inside a single try/catch/finally instead.
 *
 * Platform-level Super Admin note (SUPER_ADMIN_DASHBOARD_SCOPE.md §4a): a
 * Super Admin JWT carries tenantId: null, and TenantContextMiddleware marks
 * that as tenantResolved: true (as opposed to an unresolved pre-auth
 * request, where tenantId is also null but tenantResolved is not set). A
 * resolved-but-null tenant STILL opens an RLS transaction here — just with
 * the session var bound to the empty string, which is what the
 * tenant_isolation_* policies check for a NULL-tenant row — rather than
 * skipping RLS wrapping the way a genuinely unresolved request does.
 */
@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const store = tenantStorage.getStore();

    const hasTenantContext = !!store && (store.tenantId != null || store.tenantResolved === true);
    if (!hasTenantContext) {
      // No tenant resolved yet (e.g. POST /tenants, POST /auth/login) — nothing to scope.
      return next.handle();
    }

    return from(this.runWithRlsTransaction(store as TenantContextStore, next));
  }

  private async runWithRlsTransaction(store: TenantContextStore, next: CallHandler) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Parameterized to avoid SQL injection even though tenantId is already
      // validated as a UUID by this point (defense in depth). Bound as ''
      // rather than SQL NULL when store.tenantId is null (platform-level
      // Super Admin) — current_setting() returns NULL, not '', for a truly
      // unset GUC, and the RLS policies' null-tenant branch specifically
      // checks for '' — passing raw null here would silently fail every
      // Super Admin query rather than granting the intended cross-tenant
      // access.
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
        store.tenantId ?? '',
      ]);
      store.manager = queryRunner.manager;

      // NestJS route handlers emit exactly once then complete, so taking the
      // first emitted value here is the correct, standard way to bridge back
      // to a plain awaitable result for the rest of this function.
      const result = await firstValueFrom(next.handle());
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      store.manager = undefined;
      await queryRunner.release();
    }
  }
}

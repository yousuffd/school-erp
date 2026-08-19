import 'reflect-metadata';
import dataSource from '../config/typeorm.config';
import { Role, SystemRoleName } from '../modules/roles/entities/role.entity';
import { User, AuthProvider, UserStatus } from '../modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Creates the platform-level Super Admin USER account. Deliberately a CLI
 * script, not an HTTP endpoint — even behind an API key, minting the single
 * most powerful account on the platform (cross-tenant access to everything)
 * is a bigger attack surface than it needs to be. Run this once per
 * environment (dev, staging, production) by whoever operates the platform,
 * with direct access to the machine/CI job — never expose this over the
 * network.
 *
 * Requires the Super Admin ROLE to already exist — run migrations first
 * (CreateSuperAdminRole1785700000000 creates it idempotently).
 *
 * Usage:
 *   SUPER_ADMIN_NAME="Jane Doe" \
 *   SUPER_ADMIN_EMAIL="jane@yourcompany.com" \
 *   SUPER_ADMIN_PASSWORD="a-real-strong-password" \
 *   npx ts-node src/database/create-super-admin.ts
 *
 * Safe to re-run: if a user with this email already exists, does nothing
 * and exits cleanly rather than creating a duplicate.
 */
async function createSuperAdmin() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      'Missing required env vars. Usage:\n' +
        '  SUPER_ADMIN_NAME="..." SUPER_ADMIN_EMAIL="..." SUPER_ADMIN_PASSWORD="..." ' +
        'npx ts-node src/database/create-super-admin.ts',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('SUPER_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await dataSource.initialize();

  // This is a raw script, not a real HTTP request — it never goes through
  // TenantRlsInterceptor, so Postgres has no idea what "tenant" it's
  // operating as. RLS's answer to "you didn't say" is "show nothing," not
  // "show everything" — correct behavior, but it means we have to
  // explicitly announce ourselves the same way the interceptor does for
  // the platform-level (Super Admin) case: an empty string, not unset.
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.query(`SELECT set_config('app.current_tenant_id', '', true)`);

  const roleRepo = queryRunner.manager.getRepository(Role);
  const userRepo = queryRunner.manager.getRepository(User);

  const role = await roleRepo.findOne({
    where: { name: SystemRoleName.SUPER_ADMIN, tenant_id: null as any },
  });
  if (!role) {
    console.error(
      'Super Admin role not found. Run migrations first: npm run migration:run',
    );
    await dataSource.destroy();
    process.exit(1);
  }

  const existing = await userRepo
    .createQueryBuilder('u')
    .where('u.email = :email', { email })
    .andWhere('u.tenant_id IS NULL')
    .getOne();
  if (existing) {
    console.log(`A platform-level user with email ${email} already exists — nothing to do.`);
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = userRepo.create({
    tenant_id: null as any,
    role_id: role.id,
    name,
    email,
    auth_provider: AuthProvider.LOCAL,
    password_hash: passwordHash,
    status: UserStatus.ACTIVE,
  });
  await userRepo.save(user);

  console.log(`Super Admin account created: ${email}`);
  await dataSource.destroy();
}

createSuperAdmin().catch(async (err) => {
  console.error('Failed to create Super Admin:', err);
  await dataSource.destroy().catch(() => undefined);
  process.exit(1);
});

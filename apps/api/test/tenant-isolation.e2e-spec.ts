import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Proves the multi-tenant boundary at two independent layers:
 *
 *  1. API layer   — an authenticated Tenant B user genuinely cannot read or
 *     list Tenant A's data through the real HTTP endpoints.
 *  2. Database layer — bypassing the app entirely, a raw connection with
 *     Postgres RLS's session variable set to Tenant B cannot SELECT a
 *     Tenant A row. This is the test that actually proves the security
 *     boundary (RLS), not just today's application code around it.
 *
 * Run against a DEDICATED test database — never point this at dev/pilot data:
 *
 *   DB_DATABASE=school_erp_test PROVISIONING_API_KEY=<your .env.test key> \
 *     npm run test:e2e
 */
describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  const PREFIX = '/api/v1';
  const PROVISIONING_KEY = process.env.PROVISIONING_API_KEY;
  const PASSWORD = 'TestPassword123!';
  const suffix = Date.now(); // unique subdomains per run — safe to re-run without manual cleanup

  const tenantA = {
    subdomain: `tenant-a-${suffix}`,
    adminEmail: `admin-a-${suffix}@example.com`,
    id: '',
    token: '',
    campusId: '',
    academicYearId: '',
  };
  const tenantB = {
    subdomain: `tenant-b-${suffix}`,
    adminEmail: `admin-b-${suffix}@example.com`,
    id: '',
    token: '',
  };
  let studentAId: string;

  beforeAll(async () => {
    if (!PROVISIONING_KEY) {
      throw new Error(
        'PROVISIONING_API_KEY is not set. Run this suite with:\n' +
          '  DB_DATABASE=school_erp_test PROVISIONING_API_KEY=<key-from-.env.test> npm run test:e2e',
      );
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    // --- Provision two independent tenants through the real API, exactly
    // as production would (never insert tenant rows by hand — §21). ---
    const tenantARes = await provisionTenant(tenantA.subdomain, tenantA.adminEmail);
    tenantA.id = tenantARes.body.tenant.id;

    const tenantBRes = await provisionTenant(tenantB.subdomain, tenantB.adminEmail);
    tenantB.id = tenantBRes.body.tenant.id;

    tenantA.token = await login(tenantA.subdomain, tenantA.adminEmail);
    tenantB.token = await login(tenantB.subdomain, tenantB.adminEmail);

    // --- Minimum scaffolding a student record requires: a campus and an
    // academic year, created by Tenant A's own admin. ---
    const campusRes = await request(app.getHttpServer())
      .post(`${PREFIX}/campuses`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ tenant_id: tenantA.id, name: 'Main Campus' });
    tenantA.campusId = campusRes.body.id;

    const yearRes = await request(app.getHttpServer())
      .post(`${PREFIX}/academic-years`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        tenant_id: tenantA.id,
        label: '2025-26',
        start_date: '2025-06-01',
        end_date: '2026-04-30',
        is_current: true,
      });
    tenantA.academicYearId = yearRes.body.id;
  }, 30000); // generous timeout: 2 tenant provisions (bcrypt-hashed passwords) + 2 logins + setup calls

  afterAll(async () => {
    await app.close();
  });

  async function provisionTenant(subdomain: string, adminEmail: string) {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/tenants`)
      .set('x-provisioning-api-key', PROVISIONING_KEY as string)
      .send({
        school_name: `Test School ${subdomain}`,
        subdomain,
        first_admin_name: 'Test Admin',
        first_admin_email: adminEmail,
        first_admin_password: PASSWORD,
        plan_tier: 'starter',
      });
    if (![200, 201].includes(res.status)) {
      throw new Error(`Provisioning failed for ${subdomain}: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return res;
  }

  async function login(subdomain: string, email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ subdomain, email, password: PASSWORD });
    if (res.status !== 200) {
      throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return res.body.access_token;
  }

  // ---------------------------------------------------------------------
  // Layer 0 — sanity: Tenant A can use its own system normally.
  // If this fails, the failures below are meaningless (nothing to isolate).
  // ---------------------------------------------------------------------
  it('sanity: Tenant A admin can create a student in their own tenant', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/students`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        tenant_id: tenantA.id,
        campus_id: tenantA.campusId,
        academic_year_id: tenantA.academicYearId,
        first_name: 'Alice',
        last_name: 'Anderson',
        date_of_birth: '2012-01-01',
        gender: 'female',
        grade_level: '5',
        enrollment_date: '2025-06-01',
        guardian_name: 'Test Guardian',
        guardian_phone: '+10000000000',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    studentAId = res.body.id;
  });

  it('sanity: Tenant A admin can read back their own student', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/students/${studentAId}`)
      .set('Authorization', `Bearer ${tenantA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(studentAId);
  });

  // ---------------------------------------------------------------------
  // Layer 1 — API-level isolation.
  // ---------------------------------------------------------------------
  it('Tenant B admin CANNOT fetch Tenant A student by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/students/${studentAId}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    // Either is an acceptable "blocked" outcome — RLS makes the row
    // invisible to Tenant B's connection, which TypeORM's findOne()
    // surfaces as "not found," not a distinguishable 403.
    expect([403, 404]).toContain(res.status);
  });

  it("Tenant B admin's student list does NOT contain Tenant A's student", async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/students`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const ids = (res.body as Array<{ id: string }>).map((s) => s.id);
    expect(ids).not.toContain(studentAId);
  });

  // ---------------------------------------------------------------------
  // Layer 2 — database-level isolation. Bypasses the app entirely and
  // proves the Postgres RLS policy itself blocks the row, independent of
  // any application code. This is the test that actually matters.
  // ---------------------------------------------------------------------
  it('Postgres RLS blocks a Tenant B session from selecting a Tenant A row directly', async () => {
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Exactly what TenantRlsInterceptor does for a real Tenant B request.
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantB.id]);
      const rows = await queryRunner.query('SELECT id FROM students WHERE id = $1', [studentAId]);
      expect(rows.length).toBe(0);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });

  it('sanity: same RLS session CAN select the row when scoped to the correct tenant', async () => {
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantA.id]);
      const rows = await queryRunner.query('SELECT id FROM students WHERE id = $1', [studentAId]);
      expect(rows.length).toBe(1);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });
});

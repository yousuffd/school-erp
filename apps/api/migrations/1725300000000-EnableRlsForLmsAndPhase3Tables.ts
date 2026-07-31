import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Closes the RLS gap identified in the full-app review: LMS (Phase 2) and
 * all five active Phase 3 modules (Library, Transportation, Health &
 * Wellness, Inventory & Assets, Cafeteria) were built with tenant
 * isolation enforced only in service code via scopedRepo() — no
 * database-level Row-Level Security backstop, unlike Core Admin through
 * Examinations (see EnableRls1700000000000 and the per-module RLS blocks
 * in CreateStudentsTable / CreateAdmissionsTable / etc.).
 *
 * Unlike EnableRls1700000000000 (which needed a special-case OR branch
 * for roles.tenant_id being nullable for the platform Super Admin role),
 * every table below has tenant_id uuid NOT NULL — no nullable case here,
 * so the policy is the simple form only.
 *
 * Safe to apply globally in one pass: TenantRlsInterceptor is registered
 * as a global APP_INTERCEPTOR and TenantContextMiddleware runs on
 * forRoutes('*') (confirmed in app.module.ts), so app.current_tenant_id
 * is already set on every authenticated request before it reaches any
 * of these tables.
 */
export class EnableRlsForLmsAndPhase3Tables1725300000000 implements MigrationInterface {
  name = 'EnableRlsForLmsAndPhase3Tables1725300000000';

  private readonly tenantScopedTables = [
    // LMS
    'assignments',
    'assignment_submissions',
    'learning_resources',
    'lectures',
    'lecture_progress',
    'discussion_threads',
    'discussion_posts',
    // Library
    'books',
    'book_copies',
    'book_issues',
    'book_reservations',
    // Transportation
    'vehicles',
    'drivers',
    'routes',
    'route_stops',
    'route_assignments',
    'student_transport_assignments',
    // Health & Wellness
    'student_health_profiles',
    'immunization_records',
    'clinic_visits',
    'medication_administrations',
    'screening_campaigns',
    'screening_results',
    // Inventory & Assets
    'items',
    'item_stocks',
    'stock_transactions',
    'asset_tags',
    'procurement_requests',
    // Cafeteria
    'menu_items',
    'daily_menus',
    'daily_menu_items',
    'meal_attendance_records',
    'student_dietary_restrictions',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tenantScopedTables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_${table} ON "${table}"
        USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tenantScopedTables) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}";`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
    }
  }
}

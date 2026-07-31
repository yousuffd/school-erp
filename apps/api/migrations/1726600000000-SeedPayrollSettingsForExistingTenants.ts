import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds a default PayrollSettings row (professional_tax_amount = 200, the
 * documented India default) for every already-provisioned tenant. New
 * tenants provisioned after this ships need the equivalent handled in
 * TenantsService.provision() or PayrollSettingsService.findOrCreate() —
 * whichever the actual service implementation uses (see service design).
 */
export class SeedPayrollSettingsForExistingTenants1726600000000 implements MigrationInterface {
  name = 'SeedPayrollSettingsForExistingTenants1726600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants: Array<{ id: string }> = await queryRunner.query(`SELECT id FROM tenants`);
    for (const tenant of tenants) {
      const existing = await queryRunner.query(`SELECT id FROM payroll_settings WHERE tenant_id = $1`, [tenant.id]);
      if (existing.length > 0) continue;
      await queryRunner.query(
        `INSERT INTO payroll_settings (id, tenant_id, professional_tax_amount, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 200, now(), now())`,
        [tenant.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM payroll_settings`);
  }
}
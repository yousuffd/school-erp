import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates an Employee record for every existing User whose role is Teacher,
 * School Admin, or District Admin — the three roles confirmed as "real
 * staff" for this backfill (Super Admin is platform-level, not tenant
 * staff; Student/Parent obviously excluded). New users created after this
 * ships are NOT auto-converted to Employee records — that's a deliberate
 * manual step (HR Manager links/creates as needed), this migration only
 * catches up pre-existing accounts. department/designation are seeded with
 * a placeholder ('General'/role name) since that data doesn't exist
 * anywhere yet — a real HR Manager should correct these after the fact.
 */
export class BackfillEmployeeRecordsForExistingStaff1726200000000 implements MigrationInterface {
  name = 'BackfillEmployeeRecordsForExistingStaff1726200000000';

  private readonly staffRoleNames = ['Teacher', 'School Admin', 'District/Trust Admin'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users: Array<{ id: string; tenant_id: string; name: string; email: string; role_name: string }> =
      await queryRunner.query(
        `SELECT u.id, u.tenant_id, u.name, u.email, r.name as role_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.name = ANY($1::text[])`,
        [this.staffRoleNames],
      );

    for (const user of users) {
      const existing = await queryRunner.query(`SELECT id FROM employees WHERE user_id = $1`, [user.id]);
      if (existing.length > 0) continue;

      await queryRunner.query(
        `INSERT INTO employees
           (id, tenant_id, user_id, name, email, department, designation, employment_type, status, date_of_joining, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'General', $5, 'full_time', 'active', CURRENT_DATE, now(), now())`,
        [user.tenant_id, user.id, user.name, user.email, user.role_name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM employees WHERE user_id IS NOT NULL`);
  }
}
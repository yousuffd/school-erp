import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links a login account (User) to a school record (Student) — nothing in
 * this app has ever let a student log in before this, since no column
 * connected the two. Nullable because most Users (Admin/Teacher/etc.) are
 * never students, and even Student-role Users might not have this set
 * immediately (a student can be enrolled long before anyone provisions
 * them a login).
 *
 * Partial unique index (not a full unique constraint) so multiple NULLs are
 * allowed — a plain UNIQUE constraint on a nullable column would still
 * only allow ONE NULL row total in strict SQL semantics in some databases,
 * but Postgres actually treats NULLs as distinct for UNIQUE already. Using
 * a partial index here anyway to be explicit about intent: uniqueness only
 * applies to real (non-null) student_id values, i.e. "one login per
 * student," and it reads clearly for anyone auditing this later.
 */
export class AddStudentIdToUsers1723000000000 implements MigrationInterface {
  name = 'AddStudentIdToUsers1723000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "student_id" uuid NULL,
      ADD CONSTRAINT "FK_users_student" FOREIGN KEY ("student_id")
        REFERENCES "students"("id") ON DELETE SET NULL;

      CREATE UNIQUE INDEX "UQ_users_student_id" ON "users" ("student_id")
      WHERE "student_id" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_student_id";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_student";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "student_id";
    `);
  }
}
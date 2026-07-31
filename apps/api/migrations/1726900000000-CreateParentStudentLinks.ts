import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParentStudentLinks1726900000000 implements MigrationInterface {
  name = 'CreateParentStudentLinks1726900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "parent_student_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "parent_user_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parent_student_links" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_parent_student_links_tenant_parent_student" UNIQUE ("tenant_id", "parent_user_id", "student_id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "parent_student_links" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_parent_student_links" ON "parent_student_links"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parent_student_links"`);
  }
}

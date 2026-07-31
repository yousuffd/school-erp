import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherSubjectSpecializations1727800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "teacher_subject_specializations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "teacher_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teacher_subject_specializations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tss_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tss_teacher" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tss_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_tss_tenant_teacher" ON "teacher_subject_specializations" ("tenant_id", "teacher_id")
    `);
    await queryRunner.query(`ALTER TABLE "teacher_subject_specializations" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_teacher_subject_specializations ON "teacher_subject_specializations"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_teacher_subject_specializations ON "teacher_subject_specializations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_subject_specializations"`);
  }
}

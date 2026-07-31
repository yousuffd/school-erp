import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamGroups1722000000000 implements MigrationInterface {
  name = 'CreateExamGroups1722000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exam_groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_groups" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exam_groups_academic_year" FOREIGN KEY ("academic_year_id")
          REFERENCES "academic_years"("id") ON DELETE CASCADE
      );

      ALTER TABLE "exam_groups" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "tenant_isolation_exam_groups" ON "exam_groups"
        USING (tenant_id = current_setting('app.tenant_id')::uuid);
    `);

    // NOTE: adjust "exams" below if your actual table name differs.
    await queryRunner.query(`
      ALTER TABLE "exams"
      ADD COLUMN "exam_group_id" uuid NULL,
      ADD CONSTRAINT "FK_exams_exam_group" FOREIGN KEY ("exam_group_id")
        REFERENCES "exam_groups"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exams_exam_group_id" ON "exams" ("exam_group_id");
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exams_exam_group_id";`);
    await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "FK_exams_exam_group";`);
    await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN IF EXISTS "exam_group_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_groups";`);
  }
}

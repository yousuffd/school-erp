import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceTable1720400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "attendance_records_status_enum" AS ENUM ('present', 'absent', 'late', 'excused')
    `);
    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "date" date NOT NULL,
        "status" "attendance_records_status_enum" NOT NULL,
        "marked_by" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendance_records_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_records_class" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_records_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_records_marked_by" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_attendance_records_class_student_date"
      ON "attendance_records" ("tenant_id", "school_class_id", "student_id", "date")
    `);
    await queryRunner.query(`ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_attendance_records ON "attendance_records"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_attendance_records ON "attendance_records";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attendance_records_status_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHrManagementTables1725900000000 implements MigrationInterface {
  name = 'CreateHrManagementTables1725900000000';

  private readonly tables = [
    'job_openings',
    'applicants',
    'employees',
    'leave_requests',
    'staff_attendance_records',
    'performance_review_cycles',
    'performance_reviews',
    'staff_certifications',
    'succession_plans',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "job_openings_status_enum" AS ENUM ('open', 'closed')`);
    await queryRunner.query(`
      CREATE TABLE "job_openings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "department" varchar(100) NOT NULL,
        "description" text,
        "status" "job_openings_status_enum" NOT NULL DEFAULT 'open',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_openings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "applicants_stage_enum" AS ENUM ('applied', 'screening', 'interview', 'offered', 'hired', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TABLE "applicants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "job_opening_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "email" varchar(254) NOT NULL,
        "phone" varchar(32),
        "resume_url" varchar,
        "stage" "applicants_stage_enum" NOT NULL DEFAULT 'applied',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applicants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "employees_employment_type_enum" AS ENUM ('full_time', 'part_time', 'contract')
    `);
    await queryRunner.query(`
      CREATE TYPE "employees_status_enum" AS ENUM ('active', 'on_leave', 'terminated')
    `);
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "manager_id" uuid,
        "name" varchar(200) NOT NULL,
        "email" varchar(254) NOT NULL,
        "department" varchar(100) NOT NULL,
        "designation" varchar(100) NOT NULL,
        "employment_type" "employees_employment_type_enum" NOT NULL DEFAULT 'full_time',
        "status" "employees_status_enum" NOT NULL DEFAULT 'active',
        "date_of_joining" date NOT NULL,
        "contract_end_date" date,
        "base_salary" numeric,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employees" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leave_requests_leave_type_enum" AS ENUM ('casual', 'sick', 'earned', 'unpaid')
    `);
    await queryRunner.query(`
      CREATE TYPE "leave_requests_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "leave_type" "leave_requests_leave_type_enum" NOT NULL,
        "from_date" date NOT NULL,
        "to_date" date NOT NULL,
        "reason" text,
        "status" "leave_requests_status_enum" NOT NULL DEFAULT 'pending',
        "approved_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "staff_attendance_records_status_enum" AS ENUM ('present', 'absent', 'on_leave')
    `);
    await queryRunner.query(`
      CREATE TABLE "staff_attendance_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "date" date NOT NULL,
        "status" "staff_attendance_records_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_staff_attendance_employee_date" UNIQUE ("tenant_id", "employee_id", "date")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "performance_review_cycles_status_enum" AS ENUM ('open', 'calibrating', 'closed')
    `);
    await queryRunner.query(`
      CREATE TABLE "performance_review_cycles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "cycle_name" varchar(150) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "performance_review_cycles_status_enum" NOT NULL DEFAULT 'open',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_review_cycles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "performance_reviews_reviewer_type_enum" AS ENUM ('self', 'peer', 'manager')
    `);
    await queryRunner.query(`
      CREATE TABLE "performance_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "cycle_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "reviewer_id" uuid NOT NULL,
        "reviewer_type" "performance_reviews_reviewer_type_enum" NOT NULL,
        "rating" integer NOT NULL,
        "comments" text,
        "calibrated_rating" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_reviews" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "staff_certifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "certification_name" varchar(150) NOT NULL,
        "issued_date" date NOT NULL,
        "expiry_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_certifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "succession_plans_readiness_level_enum" AS ENUM ('ready_now', 'ready_1_2_years', 'developing')
    `);
    await queryRunner.query(`
      CREATE TABLE "succession_plans" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "position_employee_id" uuid NOT NULL,
        "successor_employee_id" uuid,
        "readiness_level" "succession_plans_readiness_level_enum",
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_succession_plans" PRIMARY KEY ("id")
      )
    `);

    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation_${table}" ON "${table}"
        USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...this.tables].reverse()) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
    await queryRunner.query(`DROP TYPE "job_openings_status_enum"`);
    await queryRunner.query(`DROP TYPE "applicants_stage_enum"`);
    await queryRunner.query(`DROP TYPE "employees_employment_type_enum"`);
    await queryRunner.query(`DROP TYPE "employees_status_enum"`);
    await queryRunner.query(`DROP TYPE "leave_requests_leave_type_enum"`);
    await queryRunner.query(`DROP TYPE "leave_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "staff_attendance_records_status_enum"`);
    await queryRunner.query(`DROP TYPE "performance_review_cycles_status_enum"`);
    await queryRunner.query(`DROP TYPE "performance_reviews_reviewer_type_enum"`);
    await queryRunner.query(`DROP TYPE "succession_plans_readiness_level_enum"`);
  }
}
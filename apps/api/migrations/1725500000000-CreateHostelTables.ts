import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates all six Hostel Management tables (Blueprint Part 2, Module 14)
 * with RLS enabled from the start — unlike the original 5 tables and
 * everything through Examinations, which had RLS retrofitted later
 * (EnableRlsForLmsAndPhase3Tables), every table here gets its policy in
 * the same migration that creates it. school_erp_app already has
 * ALTER DEFAULT PRIVILEGES applied from session 22, so no explicit GRANT
 * should be needed — confirm via `\dp hostel_rooms` etc. in psql if
 * anything 403s unexpectedly at the DB layer.
 */
export class CreateHostelTables1725500000000 implements MigrationInterface {
  name = 'CreateHostelTables1725500000000';

  private readonly tables = [
    'hostel_rooms',
    'hostel_room_allocations',
    'hostel_visitors',
    'hostel_maintenance_requests',
    'hostel_attendance_records',
    'hostel_room_preferences',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "hostel_rooms_room_type_enum" AS ENUM ('single', 'double', 'dormitory')
    `);
    await queryRunner.query(`
      CREATE TABLE "hostel_rooms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "building_name" varchar(100) NOT NULL,
        "room_number" varchar(20) NOT NULL,
        "floor" integer,
        "capacity" integer NOT NULL,
        "room_type" "hostel_rooms_room_type_enum" NOT NULL DEFAULT 'double',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_rooms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_hostel_rooms_unit" UNIQUE ("tenant_id", "campus_id", "building_name", "room_number")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "hostel_room_allocations_status_enum" AS ENUM ('active', 'vacated')
    `);
    await queryRunner.query(`
      CREATE TABLE "hostel_room_allocations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "allocated_date" date NOT NULL,
        "vacated_date" date,
        "status" "hostel_room_allocations_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_room_allocations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "hostel_visitors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "visitor_name" varchar(150) NOT NULL,
        "relation" varchar(100) NOT NULL,
        "purpose" text,
        "id_proof_type" varchar(50),
        "id_proof_number" varchar(50),
        "check_in_time" TIMESTAMP NOT NULL,
        "check_out_time" TIMESTAMP,
        "pass_code" varchar(20),
        "verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_visitors" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "hostel_maintenance_requests_status_enum" AS ENUM ('open', 'in_progress', 'resolved')
    `);
    await queryRunner.query(`
      CREATE TABLE "hostel_maintenance_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "description" text NOT NULL,
        "status" "hostel_maintenance_requests_status_enum" NOT NULL DEFAULT 'open',
        "reported_by" uuid NOT NULL,
        "reported_date" date NOT NULL,
        "resolved_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_maintenance_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "hostel_attendance_records_status_enum" AS ENUM ('present', 'absent', 'on_leave')
    `);
    await queryRunner.query(`
      CREATE TABLE "hostel_attendance_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "date" date NOT NULL,
        "status" "hostel_attendance_records_status_enum" NOT NULL,
        "curfew_check_in_time" time,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_hostel_attendance_records_student_date" UNIQUE ("tenant_id", "student_id", "date")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "hostel_room_preferences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "preferred_roommate_id" uuid,
        "preferred_floor" integer,
        "notes" text,
        "matched_room_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_room_preferences" PRIMARY KEY ("id")
      )
    `);

    // RLS — every table, tenant_id NOT NULL throughout, no nullable edge case
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
    await queryRunner.query(`DROP TYPE "hostel_rooms_room_type_enum"`);
    await queryRunner.query(`DROP TYPE "hostel_room_allocations_status_enum"`);
    await queryRunner.query(`DROP TYPE "hostel_maintenance_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "hostel_attendance_records_status_enum"`);
  }
}
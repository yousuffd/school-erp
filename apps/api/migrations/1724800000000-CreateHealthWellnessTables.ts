import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Health & Wellness core (Blueprint Part 2, Module 16): structured student
 * health profiles, immunization records, clinic visit logs, medication
 * administration tracking, and screening campaigns + per-student results.
 *
 * Follows the examinations/lms/library/transportation convention: no Row-
 * Level Security (still only actually on 5 tables project-wide); tenant
 * isolation enforced in service code via scopedRepo().
 *
 * Counseling case management (confidentiality-tiered) is out of scope
 * this pass — Advanced/Premium tier per the blueprint, deferred.
 */
export class CreateHealthWellnessTables1724800000000 implements MigrationInterface {
  name = 'CreateHealthWellnessTables1724800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "student_health_profiles_blood_group_enum" AS ENUM
        ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')
    `);
    await queryRunner.query(`
      CREATE TYPE "screening_campaigns_screening_type_enum" AS ENUM ('vision', 'dental', 'bmi', 'other')
    `);

    await queryRunner.query(`
      CREATE TABLE "student_health_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "blood_group" "student_health_profiles_blood_group_enum" NOT NULL DEFAULT 'unknown',
        "allergies" text,
        "chronic_conditions" text,
        "updated_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_health_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shp_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shp_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_shp_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_shp_tenant_student" ON "student_health_profiles" ("tenant_id", "student_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "immunization_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "vaccine_name" character varying(150) NOT NULL,
        "date_administered" date NOT NULL,
        "recorded_by" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_immunization_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ir_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ir_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ir_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ir_tenant_student" ON "immunization_records" ("tenant_id", "student_id")`);

    await queryRunner.query(`
      CREATE TABLE "clinic_visits" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "visit_date" TIMESTAMP NOT NULL,
        "reason" text NOT NULL,
        "treatment_given" text,
        "follow_up_required" boolean NOT NULL DEFAULT false,
        "recorded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinic_visits" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cv_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cv_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cv_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cv_tenant_student" ON "clinic_visits" ("tenant_id", "student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_cv_tenant_date" ON "clinic_visits" ("tenant_id", "visit_date")`);

    await queryRunner.query(`
      CREATE TABLE "medication_administrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "medication_name" character varying(150) NOT NULL,
        "dosage" character varying(50) NOT NULL,
        "administered_at" TIMESTAMP NOT NULL,
        "administered_by" uuid NOT NULL,
        "consent_confirmed" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medication_administrations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ma_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ma_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ma_administered_by" FOREIGN KEY ("administered_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ma_tenant_student" ON "medication_administrations" ("tenant_id", "student_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "screening_campaigns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "screening_type" "screening_campaigns_screening_type_enum" NOT NULL,
        "campaign_date" date NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_screening_campaigns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sc_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sc_tenant" ON "screening_campaigns" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "screening_results" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "campaign_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "result_summary" text,
        "flagged_for_followup" boolean NOT NULL DEFAULT false,
        "recorded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_screening_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sr_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sr_campaign" FOREIGN KEY ("campaign_id") REFERENCES "screening_campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sr_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sr_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sr_tenant_campaign_student" ON "screening_results" ("tenant_id", "campaign_id", "student_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_sr_tenant_student" ON "screening_results" ("tenant_id", "student_id")`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "screening_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "screening_campaigns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medication_administrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_visits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "immunization_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_health_profiles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "screening_campaigns_screening_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_health_profiles_blood_group_enum"`);
  }
}

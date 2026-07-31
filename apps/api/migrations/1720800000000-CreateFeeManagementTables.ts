import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeeManagementTables1720800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- fee_structures ---
    await queryRunner.query(`
      CREATE TABLE "fee_structures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "grade_level" character varying(40) NOT NULL,
        "name" character varying(150) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_structures" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_structures_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_structures_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_fee_structures_tenant_year_grade" ON "fee_structures" ("tenant_id", "academic_year_id", "grade_level")
    `);
    await queryRunner.query(`ALTER TABLE "fee_structures" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_fee_structures ON "fee_structures"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    // --- fee_components ---
    await queryRunner.query(`
      CREATE TABLE "fee_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fee_structure_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_fee_components" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_components_structure" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE
      )
    `);
    // No direct tenant_id column on this table (it's always reached via its
    // parent fee_structure, which is itself RLS-protected) — RLS here would
    // need a subquery against fee_structures; skipped for Phase 1 since this
    // table is never queried directly without its structure, only ever
    // through FeeStructuresService which already scopes by structure id.

    // --- fee_installments ---
    await queryRunner.query(`
      CREATE TABLE "fee_installments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fee_structure_id" uuid NOT NULL,
        "label" character varying(60) NOT NULL,
        "due_date" date NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_fee_installments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_installments_structure" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE
      )
    `);

    // --- fee_assignments ---
    await queryRunner.query(`
      CREATE TABLE "fee_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "fee_structure_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_assignments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_assignments_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_assignments_structure" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_fee_assignments_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_fee_assignments_tenant_student_structure"
      ON "fee_assignments" ("tenant_id", "student_id", "fee_structure_id")
    `);
    await queryRunner.query(`ALTER TABLE "fee_assignments" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_fee_assignments ON "fee_assignments"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    // --- fee_adjustments ---
    await queryRunner.query(`
      CREATE TYPE "fee_adjustments_type_enum" AS ENUM ('discount', 'fine')
    `);
    await queryRunner.query(`
      CREATE TABLE "fee_adjustments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "fee_assignment_id" uuid NOT NULL,
        "type" "fee_adjustments_type_enum" NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "reason" character varying(255) NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_adjustments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_adjustments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_adjustments_assignment" FOREIGN KEY ("fee_assignment_id") REFERENCES "fee_assignments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_adjustments_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`ALTER TABLE "fee_adjustments" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_fee_adjustments ON "fee_adjustments"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    // --- fee_payments ---
    await queryRunner.query(`
      CREATE TYPE "fee_payments_method_enum" AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "fee_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "fee_assignment_id" uuid NOT NULL,
        "fee_installment_id" uuid,
        "amount" numeric(12,2) NOT NULL,
        "payment_date" date NOT NULL,
        "method" "fee_payments_method_enum" NOT NULL,
        "reference_number" character varying(100),
        "recorded_by" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_payments_assignment" FOREIGN KEY ("fee_assignment_id") REFERENCES "fee_assignments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fee_payments_installment" FOREIGN KEY ("fee_installment_id") REFERENCES "fee_installments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fee_payments_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`ALTER TABLE "fee_payments" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_fee_payments ON "fee_payments"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fee_payments ON "fee_payments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_payments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fee_payments_method_enum"`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fee_adjustments ON "fee_adjustments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_adjustments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fee_adjustments_type_enum"`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fee_assignments ON "fee_assignments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_assignments"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "fee_installments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_components"`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fee_structures ON "fee_structures";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_structures"`);
  }
}

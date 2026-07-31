import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayrollTables1726300000000 implements MigrationInterface {
  name = 'CreatePayrollTables1726300000000';

  private readonly tables = [
    'salary_structures',
    'payroll_runs',
    'payslips',
    'payroll_settings',
    'loan_advances',
    'full_final_settlements',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_structures" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "basic_salary" numeric NOT NULL,
        "hra" numeric NOT NULL DEFAULT 0,
        "special_allowance" numeric NOT NULL DEFAULT 0,
        "other_allowances" numeric NOT NULL DEFAULT 0,
        "effective_from" date NOT NULL,
        "bank_account_number" varchar(50),
        "bank_ifsc_code" varchar(20),
        "bank_account_holder_name" varchar(200),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_salary_structures" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "payroll_runs_status_enum" AS ENUM ('draft', 'processed', 'disbursed')`);
    await queryRunner.query(`
      CREATE TABLE "payroll_runs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "status" "payroll_runs_status_enum" NOT NULL DEFAULT 'draft',
        "processed_date" date,
        "bank_file_generated_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_runs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payroll_runs_period" UNIQUE ("tenant_id", "month", "year")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payslips" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "payroll_run_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "basic_salary" numeric NOT NULL,
        "hra" numeric NOT NULL DEFAULT 0,
        "special_allowance" numeric NOT NULL DEFAULT 0,
        "other_allowances" numeric NOT NULL DEFAULT 0,
        "gross_salary" numeric NOT NULL,
        "pf_employee" numeric NOT NULL DEFAULT 0,
        "pf_employer" numeric NOT NULL DEFAULT 0,
        "esi_employee" numeric NOT NULL DEFAULT 0,
        "esi_employer" numeric NOT NULL DEFAULT 0,
        "professional_tax" numeric NOT NULL DEFAULT 0,
        "bonuses" numeric NOT NULL DEFAULT 0,
        "overtime" numeric NOT NULL DEFAULT 0,
        "reimbursements" numeric NOT NULL DEFAULT 0,
        "loan_deduction" numeric NOT NULL DEFAULT 0,
        "net_salary" numeric NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payslips" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payslips_run_employee" UNIQUE ("payroll_run_id", "employee_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payroll_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "professional_tax_amount" numeric NOT NULL DEFAULT 200,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payroll_settings_tenant" UNIQUE ("tenant_id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "loan_advances_status_enum" AS ENUM ('active', 'closed')`);
    await queryRunner.query(`
      CREATE TABLE "loan_advances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "monthly_recovery_amount" numeric NOT NULL,
        "remaining_balance" numeric NOT NULL,
        "status" "loan_advances_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_loan_advances" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "full_final_settlements_status_enum" AS ENUM ('pending', 'processed')`);
    await queryRunner.query(`
      CREATE TABLE "full_final_settlements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "last_working_date" date NOT NULL,
        "dues" numeric NOT NULL DEFAULT 0,
        "deductions" numeric NOT NULL DEFAULT 0,
        "net_settlement_amount" numeric NOT NULL,
        "status" "full_final_settlements_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_full_final_settlements" PRIMARY KEY ("id")
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
    await queryRunner.query(`DROP TYPE "payroll_runs_status_enum"`);
    await queryRunner.query(`DROP TYPE "loan_advances_status_enum"`);
    await queryRunner.query(`DROP TYPE "full_final_settlements_status_enum"`);
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlumniTables1728500000000 implements MigrationInterface {
  name = 'CreateAlumniTables1728500000000';

  private readonly tables = [
    'alumni_profiles',
    'alumni_events',
    'alumni_event_registrations',
    'donations',
    'mentorship_matches',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "alumni_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "graduation_year" integer NOT NULL,
        "current_occupation" varchar(150),
        "current_employer" varchar(150),
        "current_city" varchar(100),
        "contact_email" varchar(254),
        "contact_phone" varchar(32),
        "linkedin_url" varchar(300),
        "bio" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_alumni_profiles_student" UNIQUE ("tenant_id", "student_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "event_date" date NOT NULL,
        "location" varchar(200),
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_event_registrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "alumni_id" uuid NOT NULL,
        "registered_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_event_registrations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_alumni_event_registrations_event_alumni" UNIQUE ("event_id", "alumni_id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "donations_payment_method_enum" AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'other')`,
    );
    await queryRunner.query(`
      CREATE TABLE "donations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "alumni_id" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "donation_date" date NOT NULL,
        "purpose" varchar(200),
        "payment_method" "donations_payment_method_enum" NOT NULL,
        "recorded_by" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_donations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "mentorship_matches_status_enum" AS ENUM ('active', 'completed')`);
    await queryRunner.query(`
      CREATE TABLE "mentorship_matches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "mentor_alumni_id" uuid NOT NULL,
        "mentee_student_id" uuid NOT NULL,
        "status" "mentorship_matches_status_enum" NOT NULL DEFAULT 'active',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mentorship_matches" PRIMARY KEY ("id")
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
    await queryRunner.query(`DROP TYPE "donations_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "mentorship_matches_status_enum"`);
  }
}

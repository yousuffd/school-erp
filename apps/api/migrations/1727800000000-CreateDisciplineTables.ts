import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisciplineTables1727800000000 implements MigrationInterface {
  name = 'CreateDisciplineTables1727800000000';

  private readonly tables = ['behavior_incidents', 'corrective_actions', 'counseling_referrals'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "behavior_incidents_incident_type_enum" AS ENUM ('merit', 'demerit')`);
    await queryRunner.query(
      `CREATE TYPE "behavior_incidents_status_enum" AS ENUM ('open', 'resolved', 'escalated')`,
    );
    await queryRunner.query(`
      CREATE TABLE "behavior_incidents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "reported_by" uuid NOT NULL,
        "incident_date" date NOT NULL,
        "incident_type" "behavior_incidents_incident_type_enum" NOT NULL,
        "points" integer NOT NULL,
        "description" text NOT NULL,
        "status" "behavior_incidents_status_enum" NOT NULL DEFAULT 'open',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_behavior_incidents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "corrective_actions_status_enum" AS ENUM ('pending', 'completed')`);
    await queryRunner.query(`
      CREATE TABLE "corrective_actions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "incident_id" uuid NOT NULL,
        "description" text NOT NULL,
        "assigned_to" uuid NOT NULL,
        "due_date" date NOT NULL,
        "completed_date" date,
        "status" "corrective_actions_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corrective_actions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "counseling_referrals_status_enum" AS ENUM ('pending', 'in_progress', 'completed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "counseling_referrals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "incident_id" uuid NOT NULL,
        "referred_to" uuid NOT NULL,
        "reason" text NOT NULL,
        "status" "counseling_referrals_status_enum" NOT NULL DEFAULT 'pending',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_counseling_referrals" PRIMARY KEY ("id")
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
    await queryRunner.query(`DROP TYPE "behavior_incidents_incident_type_enum"`);
    await queryRunner.query(`DROP TYPE "behavior_incidents_status_enum"`);
    await queryRunner.query(`DROP TYPE "corrective_actions_status_enum"`);
    await queryRunner.query(`DROP TYPE "counseling_referrals_status_enum"`);
  }
}

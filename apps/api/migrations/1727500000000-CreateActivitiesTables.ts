import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivitiesTables1727500000000 implements MigrationInterface {
  name = 'CreateActivitiesTables1727500000000';

  private readonly tables = ['activities', 'activity_rosters', 'events', 'event_registrations', 'awards'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "activities_category_enum" AS ENUM ('club', 'sport', 'cultural')`);
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "category" "activities_category_enum" NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_rosters" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "activity_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "joined_date" date NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_rosters" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_activity_rosters_activity_student" UNIQUE ("activity_id", "student_id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "events_event_type_enum" AS ENUM ('competition', 'cultural', 'fixture')`);
    await queryRunner.query(`CREATE TYPE "events_result_enum" AS ENUM ('win', 'loss', 'draw')`);
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "activity_id" uuid,
        "name" varchar(150) NOT NULL,
        "event_type" "events_event_type_enum" NOT NULL,
        "event_date" date NOT NULL,
        "location" varchar(200),
        "opponent_name" varchar(150),
        "our_score" integer,
        "opponent_score" integer,
        "result" "events_result_enum",
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "event_registrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "registered_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_registrations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_registrations_event_student" UNIQUE ("event_id", "student_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "awards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "event_id" uuid,
        "title" varchar(200) NOT NULL,
        "awarded_date" date NOT NULL,
        "issued_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_awards" PRIMARY KEY ("id")
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
    await queryRunner.query(`DROP TYPE "activities_category_enum"`);
    await queryRunner.query(`DROP TYPE "events_event_type_enum"`);
    await queryRunner.query(`DROP TYPE "events_result_enum"`);
  }
}

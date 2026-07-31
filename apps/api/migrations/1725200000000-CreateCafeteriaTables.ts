import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cafeteria & Meal Management core (Blueprint Part 2, Module 22): dish
 * catalog, daily menu slots + their contents, meal attendance/headcount,
 * and student dietary restriction flags.
 *
 * Follows the established convention: no Row-Level Security (still only
 * actually on 5 tables project-wide); tenant isolation enforced in
 * service code via scopedRepo().
 *
 * meal_type_enum is a SINGLE shared Postgres enum type used by both
 * daily_menus and meal_attendance_records (both need the same
 * breakfast/lunch/snack/dinner vocabulary) — not duplicated per table,
 * unlike most other enums in this project which are table-scoped by
 * naming convention. Deliberate: these two tables' meal_type columns
 * must always agree on the same set of values by construction, not just
 * by convention.
 */
export class CreateCafeteriaTables1725200000000 implements MigrationInterface {
  name = 'CreateCafeteriaTables1725200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "meal_type_enum" AS ENUM ('breakfast', 'lunch', 'snack', 'dinner')
    `);
    await queryRunner.query(`
      CREATE TYPE "student_dietary_restrictions_restriction_type_enum" AS ENUM
        ('allergy', 'vegetarian', 'vegan', 'religious', 'other')
    `);

    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "dietary_tags" character varying(300),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menu_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_menu_items_tenant" ON "menu_items" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "daily_menus" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "menu_date" date NOT NULL,
        "meal_type" "meal_type_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_menus" PRIMARY KEY ("id"),
        CONSTRAINT "FK_daily_menus_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_daily_menus_tenant_date_type" ON "daily_menus" ("tenant_id", "menu_date", "meal_type")`,
    );

    await queryRunner.query(`
      CREATE TABLE "daily_menu_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "daily_menu_id" uuid NOT NULL,
        "menu_item_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dmi_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dmi_daily_menu" FOREIGN KEY ("daily_menu_id") REFERENCES "daily_menus"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dmi_menu_item" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_dmi_tenant_menu_item" ON "daily_menu_items" ("tenant_id", "daily_menu_id", "menu_item_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "meal_attendance_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "attendance_date" date NOT NULL,
        "meal_type" "meal_type_enum" NOT NULL,
        "recorded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meal_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mar_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mar_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_mar_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_mar_tenant_date_type_student" ON "meal_attendance_records" ("tenant_id", "attendance_date", "meal_type", "student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mar_tenant_date_type" ON "meal_attendance_records" ("tenant_id", "attendance_date", "meal_type")`,
    );

    await queryRunner.query(`
      CREATE TABLE "student_dietary_restrictions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "restriction_type" "student_dietary_restrictions_restriction_type_enum" NOT NULL,
        "details" text NOT NULL,
        "recorded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_dietary_restrictions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sdr_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sdr_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sdr_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sdr_tenant_student" ON "student_dietary_restrictions" ("tenant_id", "student_id")`,
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_dietary_restrictions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meal_attendance_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_menu_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_menus"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_dietary_restrictions_restriction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "meal_type_enum"`);
  }
}

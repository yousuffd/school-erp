import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transportation Management core (Blueprint Part 2, Module 13): vehicles,
 * standalone driver profiles, routes + stops, vehicle/driver-to-route
 * assignment, and student-to-route/stop assignment.
 *
 * Follows the examinations/lms/library convention: no Row-Level Security
 * (RLS remains opt-in, still only actually on 5 tables project-wide);
 * tenant isolation is enforced in service code via scopedRepo().
 *
 * Vehicle maintenance scheduling and live GPS tracking are both out of
 * scope this pass — see vehicle.entity.ts for the full note.
 */
export class CreateTransportationTables1724600000000 implements MigrationInterface {
  name = 'CreateTransportationTables1724600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "vehicles_status_enum" AS ENUM ('active', 'under_maintenance', 'retired')
    `);
    await queryRunner.query(`
      CREATE TYPE "drivers_status_enum" AS ENUM ('active', 'inactive')
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "registration_number" character varying(20) NOT NULL,
        "model" character varying(100),
        "capacity" integer NOT NULL,
        "status" "vehicles_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_vehicles_tenant_reg" ON "vehicles" ("tenant_id", "registration_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_vehicles_tenant" ON "vehicles" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "drivers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "license_number" character varying(50) NOT NULL,
        "phone" character varying(32) NOT NULL,
        "status" "drivers_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drivers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_drivers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_drivers_tenant" ON "drivers" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "routes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_routes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_routes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_routes_tenant" ON "routes" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "route_stops" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "route_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "sequence_order" integer NOT NULL,
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_route_stops" PRIMARY KEY ("id"),
        CONSTRAINT "FK_route_stops_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_route_stops_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_route_stops_tenant_route_seq" ON "route_stops" ("tenant_id", "route_id", "sequence_order")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_route_stops_tenant_route" ON "route_stops" ("tenant_id", "route_id")`);

    await queryRunner.query(`
      CREATE TABLE "route_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "route_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "driver_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_route_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_route_assignments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_route_assignments_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_route_assignments_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_route_assignments_driver" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_route_assignments_tenant_route_year" ON "route_assignments" ("tenant_id", "route_id", "academic_year_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_route_assignments_tenant_vehicle" ON "route_assignments" ("tenant_id", "vehicle_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_route_assignments_tenant_driver" ON "route_assignments" ("tenant_id", "driver_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "student_transport_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "route_id" uuid NOT NULL,
        "stop_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_transport_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sta_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sta_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sta_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sta_stop" FOREIGN KEY ("stop_id") REFERENCES "route_stops"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sta_tenant_student_year" ON "student_transport_assignments" ("tenant_id", "student_id", "academic_year_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sta_tenant_route" ON "student_transport_assignments" ("tenant_id", "route_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_transport_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "route_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "route_stops"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "routes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drivers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "drivers_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vehicles_status_enum"`);
  }
}

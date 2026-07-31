import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleMaintenanceRecords1726800000000 implements MigrationInterface {
  name = 'CreateVehicleMaintenanceRecords1726800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "vehicle_maintenance_records_type_enum" AS ENUM ('routine', 'repair', 'inspection')
    `);
    await queryRunner.query(`
      CREATE TYPE "vehicle_maintenance_records_status_enum" AS ENUM ('scheduled', 'completed', 'overdue')
    `);
    await queryRunner.query(`
      CREATE TABLE "vehicle_maintenance_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "maintenance_type" "vehicle_maintenance_records_type_enum" NOT NULL,
        "description" text NOT NULL,
        "scheduled_date" date NOT NULL,
        "completed_date" date,
        "cost" numeric,
        "vendor_name" varchar(200),
        "status" "vehicle_maintenance_records_status_enum" NOT NULL DEFAULT 'scheduled',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_maintenance_records" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "vehicle_maintenance_records" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_vehicle_maintenance_records" ON "vehicle_maintenance_records"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vehicle_maintenance_records"`);
    await queryRunner.query(`DROP TYPE "vehicle_maintenance_records_type_enum"`);
    await queryRunner.query(`DROP TYPE "vehicle_maintenance_records_status_enum"`);
  }
}
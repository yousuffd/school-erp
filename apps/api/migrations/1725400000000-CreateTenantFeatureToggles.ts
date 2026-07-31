
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantFeatureToggles1725400000000 implements MigrationInterface {
  name = 'CreateTenantFeatureToggles1725400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_feature_toggles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "feature_key" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_feature_toggles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenant_feature_toggles_tenant_key" UNIQUE ("tenant_id", "feature_key")
      )
    `);

    await queryRunner.query(`ALTER TABLE "tenant_feature_toggles" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_tenant_feature_toggles" ON "tenant_feature_toggles"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);

    // Seed: match Cafeteria's existing frontend-only hide, so the backend
    // route-level block and the UI agree the moment this ships — closes the
    // gap where FeatureToggleGuard's default-enabled behavior would
    // otherwise briefly re-open these two routes server-side.
    await queryRunner.query(`
      INSERT INTO "tenant_feature_toggles" (tenant_id, feature_key, enabled)
      VALUES
        ('fa0edb4d-37ca-4057-83b1-59bb6e8cb489', 'cafeteria.meal_attendance', false),
        ('fa0edb4d-37ca-4057-83b1-59bb6e8cb489', 'cafeteria.dietary_restrictions', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_feature_toggles"`);
  }
}
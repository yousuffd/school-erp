import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates all Phase 0 tables (Tenant, Campus, AcademicYear, Role, Permission, User)
 * matching the entity definitions exactly. This MUST run before EnableRls1700000000000
 * (hence the earlier timestamp in the filename/class name) since that migration only
 * toggles a security setting on tables that already exist.
 */
export class CreateInitialSchema1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "tenants_status_enum" AS ENUM ('provisioning', 'active', 'suspended', 'offboarded')
    `);
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_name" character varying(200) NOT NULL,
        "subdomain" character varying(63) NOT NULL,
        "logo_url" character varying,
        "primary_color" character varying(7) NOT NULL DEFAULT '#0D9488',
        "status" "tenants_status_enum" NOT NULL DEFAULT 'provisioning',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_subdomain" UNIQUE ("subdomain"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "campuses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "address" text,
        "timezone" character varying(64) NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campuses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campuses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "academic_years" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "label" character varying(20) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_current" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academic_years" PRIMARY KEY ("id"),
        CONSTRAINT "FK_academic_years_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "module" character varying(100) NOT NULL,
        "action" character varying(20) NOT NULL,
        "description" text,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid,
        "name" character varying(100) NOT NULL,
        "is_system_role" boolean NOT NULL DEFAULT false,
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "users_auth_provider_enum" AS ENUM ('local', 'google_sso', 'microsoft_sso', 'saml')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM ('invited', 'active', 'disabled')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid,
        "role_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "email" character varying(254) NOT NULL,
        "phone" character varying(32),
        "auth_provider" "users_auth_provider_enum" NOT NULL DEFAULT 'local',
        "password_hash" character varying,
        "status" "users_status_enum" NOT NULL DEFAULT 'invited',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_users_campus" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_auth_provider_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_years"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campuses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenants_status_enum"`);
  }
}

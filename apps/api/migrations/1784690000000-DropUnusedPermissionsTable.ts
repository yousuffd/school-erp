import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops the 'permissions' table and removes the corresponding Permission
 * entity — dead code confirmed during the repo-wide dead-code audit
 * (session 37). This table was created in the very first migration
 * (CreateInitialSchema) per the blueprint's original Phase 0 entity list,
 * but RBAC actually shipped storing permissions as JSONB directly on
 * Role.permissions instead — confirmed via RolesService's own existing
 * comment ("the `permissions` table (Permission entity) is never actually
 * populated") and a direct query confirming zero rows before this
 * migration was written. Nothing in the codebase referenced the Permission
 * entity class anywhere (confirmed via repo-wide search before removal);
 * a clean `nest build` after deleting the entity file further confirmed
 * zero real dependents.
 *
 * Hand-written rather than auto-generated, matching the project's established
 * practice (see AllowCoLocatedElectiveTimetableSlots migration) — touches
 * only this one table.
 */
export class DropUnusedPermissionsTable1784690000000 implements MigrationInterface {
    name = 'DropUnusedPermissionsTable1784690000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "public"."permissions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "public"."permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "module" character varying(100) NOT NULL,
                "action" character varying(20) NOT NULL,
                "description" text,
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
            )
        `);
    }
}

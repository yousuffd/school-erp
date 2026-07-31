# SchoolERP — Phase 0 Backend Scaffold

NestJS modular monolith (API Gateway/BFF layer, per Blueprint Part 3/4). This is the
Phase 0 foundation: multi-tenant skeleton, JWT auth (SSO-ready), RBAC engine, and the
Core Admin entities (Tenant, Campus, AcademicYear, Role, Permission, User).

## Stack (this scaffold)
- NestJS 10 + TypeScript
- PostgreSQL via TypeORM (RLS-based multi-tenancy for Phase 0 — see `docs/MULTI_TENANCY.md`)
- Passport JWT strategy (access + refresh tokens); SSO/SAML/OIDC is a pluggable strategy added later, not blocking Phase 0
- class-validator DTOs, Swagger/OpenAPI docs at `/api/docs`

## Getting started

```bash
cd apps/api
cp .env.example .env
npm install
docker compose -f ../../docker-compose.yml up -d   # postgres + redis
npm run migration:run
npm run seed        # seeds system roles + a demo tenant (see §6 of Phase 0 kickoff)
npm run start:dev
```

API will be up at `http://localhost:3000/api/v1`, Swagger docs at `http://localhost:3000/api/docs`.

## What's implemented (Phase 0 scope only — see PHASE_0_KICKOFF.md)

- [x] `Tenant`, `Campus`, `AcademicYear`, `Role`, `Permission`, `User` entities (fields per blueprint §5.3)
- [x] Tenant provisioning endpoint (`POST /tenants`) — creates tenant + seeds system roles for it
- [x] JWT auth (`POST /auth/login`, `POST /auth/refresh`) — local strategy now, OIDC/SAML strategy slot reserved
- [x] RBAC guard + `@Permissions()` decorator enforcing the Phase 0 matrix (kickoff §4)
- [x] Tenant-context middleware + Postgres RLS policies (tenant isolation enforced at the DB layer, not just app layer)
- [x] Academic Year / Campus / Role CRUD endpoints (kickoff §7 API contract stubs)
- [x] CI pipeline (lint + test + build) via GitHub Actions

## What's intentionally NOT here yet (out of Phase 0 scope)
Admissions, Student Lifecycle, Attendance, Fees, Communication — all Phase 1+. Do not build ahead of the roadmap (kickoff §1).

## Multi-tenancy strategy implemented now
Row-Level Security (RLS) keyed on `tenant_id`, suitable for the Starter tier (blueprint §4.3).
Schema-per-tenant for Growth/Enterprise tenants is a mechanical migration on top of this, not
implemented in Phase 0 — flagged in PROGRESS.md as a Phase 1+ decision point.

# SchoolERP — Multi-Tenant SaaS Platform

NestJS modular monolith (API) + Next.js web app. Multi-tenant school ERP with
Postgres Row-Level Security tenant isolation, JWT auth, and scoped RBAC.

**Status: pre-pilot.** Far more is built than a "Phase 0 scaffold" — see
`PROGRESS.md` for the accurate current state and what's actually launching.

## Stack
- **API**: NestJS 10 + TypeScript, TypeORM, PostgreSQL, Redis
- **Web**: Next.js, Tailwind
- **Auth**: JWT (access + refresh), permissions re-checked from DB per request (not trusted from token)
- **Multi-tenancy**: shared schema + `tenant_id` + Postgres RLS, enforced via `TenantRlsInterceptor`
  (opens a per-request transaction, sets `app.current_tenant_id` via `set_config`)
- **API docs**: Swagger at `/api/docs`

## Modules that exist in this codebase
academic-years, activities, admissions, alumni, attendance, auth, billing,
cafeteria, campuses, classes, communication, diary, discipline, documents,
examinations, feature-toggles, fees, health-wellness, hostel, hr-management,
inventory-assets, library, lms, payroll, platform-admin, roles, students,
subjects, tenants, timetable, transportation, users

Not all of these are enabled for every tenant — see "Feature toggles" below.

## Getting started (local dev)

```bash
cd apps/api
cp .env.example .env
npm install
docker compose -f ../../docker-compose.yml up -d   # postgres + redis
npm run migration:run
npm run seed
npm run start:dev
```

API: `http://localhost:3000/api/v1` · Swagger: `http://localhost:3000/api/docs`

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

## Feature toggles

Every module is enabled by default per tenant (`tenant_feature_toggles` table,
absence of a row = enabled). Disabling a feature for a tenant is an operational
config change, not a code change — see `feature-toggles` module. This is used
to keep new/pilot tenants scoped to a smaller module set without touching code.

## Multi-tenancy — important

RLS is a real security boundary here, not just app-level convenience. Do not
bypass `TenantRlsInterceptor` or query the database outside a request context
without setting `app.current_tenant_id` explicitly — see the interceptor's
comments for why an earlier, simpler version of this had a real gap.

## Contributing / architecture decisions

See `PROGRESS.md` for current build status and open decisions, and the
project's Master Prompt for architectural principles (incremental changes,
inspect-before-replace, tenant isolation as a first-class concern).
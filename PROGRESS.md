# SchoolERP — Build Progress Tracker

Update this after every working session and paste/attach it (along with the blueprint + DESIGN_SYSTEM.md) into any new AI-tool session, so it picks up where the last one left off instead of re-deriving context.

---

## Current Phase
**Phase 0 — Foundation** (Sprints 1-4)

## Status
- [x] Multi-tenant provisioning service — `POST /tenants` creates a tenant + seeds its 6 system roles in one call. RLS migration written (`1700000000000-EnableRls.ts`) enabling Postgres RLS on `campuses`, `academic_years`, `roles`, `users`, keyed on `tenant_id`. Tenant resolution + AsyncLocalStorage context in place; the query-runner hook that actually *sets* the `app.current_tenant_id` session var per-request is **not yet wired** — RLS policies exist but app-level `tenant_id` filtering (already in every service) is the only enforcement until that hook lands. Flagged below as an open item.
- [x] Auth (SSO-ready) + RBAC engine — Local email/password login + refresh via JWT (`POST /auth/login`, `POST /auth/refresh`), `JwtStrategy` re-reads role/permissions from DB on every request (not trusted from token). `RbacGuard` + `@Permissions()` decorator enforce the Phase 0 matrix (kickoff §4) — unit-tested (Teacher blocked from Core Admin, School Admin allowed, Super Admin bypass). SSO/SAML/OIDC is **not implemented** — the auth service is written provider-agnostically so a Google/Microsoft/SAML Passport strategy can be added as a sibling to `JwtStrategy` without touching token-issuing logic, but no IdP is wired yet.
- [ ] CI/CD pipelines — GitHub Actions workflow written (`.github/workflows/ci.yml`: lint, build, test against a Postgres service container) but **never run** (no GitHub repo pushed yet — this only exists in the local sandbox). Argo CD / Kubernetes deploy stage from the blueprint's Part 3 recommendation not started.
- [ ] Design system implemented in code — **not started**. This session was backend-only per your steer; DESIGN_SYSTEM.md tokens are not yet wired into any Tailwind config because the frontend app doesn't exist yet.
- [ ] Core Admin module UI — **not started** (backend API for it exists: Academic Year/Campus/Role CRUD endpoints below).
- [ ] Dashboard shell — **not started**, blocked on frontend scaffold.

## What's actually built and verified this session (backend only)
- NestJS 10 + TypeScript modular monolith at `apps/api`, builds clean (`npx nest build`), lints clean, 3 unit tests passing.
- Entities: `Tenant`, `Campus`, `AcademicYear`, `Role`, `Permission`, `User` — fields match blueprint §5.3 exactly.
- Endpoints live per kickoff §7 contract: `POST /tenants`, `GET /tenants`, `GET /tenants/:id`, `POST /auth/login`, `POST /auth/refresh`, `GET/POST /academic-years`, `PATCH /academic-years/:id/set-current`, `GET/POST /campuses`, `GET/POST /roles`, `PATCH /roles/:id/permissions`, `GET/POST /users`.
- Swagger/OpenAPI docs auto-generated at `/api/docs`.
- Seed script (`npm run seed`) creates a demo tenant ("demo" subdomain), 3 campuses, 2 academic years (one current), all 6 system roles, 3 test users per role, password `Password123!` — matches kickoff §6 exactly (no fabricated student/attendance/fee data).
- `docker-compose.yml` for local Postgres + Redis.

**Not yet run against a live database** — this sandbox has no Postgres/Docker available, so migrations and the seed script are written and reviewed but not execution-tested. **First thing to do in a real dev environment: run `docker compose up -d`, `npm run migration:run`, `npm run seed`, `npm run start:dev` and confirm end-to-end.**

## Repo Structure (as of this session)
```
school-erp/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── README.md
└── apps/api/                       (NestJS)
    ├── .env.example
    ├── migrations/1700000000000-EnableRls.ts
    └── src/
        ├── main.ts, app.module.ts
        ├── config/typeorm.config.ts
        ├── database/seed.ts
        ├── common/
        │   ├── context/tenant-context.ts        (AsyncLocalStorage)
        │   ├── middleware/tenant-context.middleware.ts
        │   ├── decorators/ (public, permissions, current-user)
        │   ├── guards/ (jwt-auth, rbac + tests)
        │   └── filters/all-exceptions.filter.ts
        └── modules/
            ├── auth/        (login, refresh, JwtStrategy)
            ├── tenants/     (provisioning)
            ├── campuses/
            ├── academic-years/
            ├── roles/       (system role seed + Phase 0 permission matrix)
            └── users/
```
(No frontend app yet — `apps/web` doesn't exist.)

## Deviations from Blueprint
- **Role.permissions stored as jsonb**, not a normalized join table — blueprint §5.3 allowed either. Chosen for a single-read permission check on the hot path. Flagged as a Phase 1+ candidate to revisit if per-permission audit/versioning is needed.
- **bcrypt → bcryptjs**: native `bcrypt` failed to compile in this sandbox (no network access to download prebuilt binaries / node headers). Swapped to pure-JS `bcryptjs`, same API. In a normal dev/CI environment native `bcrypt` would install fine and is arguably preferable for hashing throughput — worth reverting if your target environment has no such restriction.
- **RLS enforcement is partial**: policies are written and will apply once Postgres has them, but the middleware that sets `app.current_tenant_id` per-connection is not yet wired (see Open Questions below). Until then, tenant isolation is enforced only by explicit `tenant_id` filters in each service — treat this as a real gap, not just defense-in-depth, until fixed.

## Open Questions / Blockers
1. **RLS session-variable hook**: need a TypeORM subscriber or a custom query runner that runs `SET LOCAL app.current_tenant_id = '<id>'` at the start of every transaction, reading from `tenantStorage` (AsyncLocalStorage). Without this, the RLS policies in the migration are inert.
2. **SSO provider choice**: blueprint suggests Auth0/Cognito/Ory. Nothing chosen yet — current JWT auth is fully local-credentials. Needs a decision before SSO work starts (this was flagged as an acceptance criterion: "an admin can log in via SSO" — currently only JWT local login is demoable, not actual SSO).
3. **Custom-role permission editing** currently blocked for system roles by design (kickoff didn't specify whether tenants should be able to edit system-role permissions vs. only create custom roles) — built as "system roles fixed, custom roles editable." Flag if that's wrong.
4. This sandbox has no Postgres/Docker, so none of the above has been run against a live database — needs verification in a real environment before Phase 0 sign-off.

## Next Session Should Start With
1. Spin up the backend for real (`docker compose up -d && npm run migration:run && npm run seed && npm run start:dev`) and confirm the 3 Phase 0 acceptance criteria that are backend-testable: tenant provisioning end-to-end, JWT login, RBAC blocking Teacher.
2. Wire the RLS session-variable hook (Open Question #1) — this is the one real correctness gap.
3. Then move to the frontend: Next.js + Tailwind scaffold, DESIGN_SYSTEM.md tokens wired in, dashboard shell, Core Admin screens — this was explicitly deferred this session in favor of backend-first.

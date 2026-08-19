# SchoolERP — Build Progress Tracker

Keep this accurate. Previous versions of this file badly understated what was
actually built (described a "Phase 0, 6 entities" state when ~30 modules,
462 backend files, 155 frontend files, and 79 migrations already existed).
Verify against the actual code before writing status here — don't assume
this file (or any doc) is right without checking.

## Current focus
**2-week pilot launch** — one real school, on real data. Not multi-tenant
onboarding yet, not mobile yet. See the production readiness plan doc.

## What's actually built (verified against source, not assumed)
- Full auth: JWT access+refresh, permissions re-checked from DB per request
- RBAC: role + permission + scope model, `RbacGuard` + `@Permissions()`
- Tenant isolation: `TenantRlsInterceptor` wraps each request in a transaction
  with `app.current_tenant_id` set via `set_config` — implemented, needs a
  proven isolation test suite before pilot data goes in (open item below)
- Control plane: `platform-admin`, `billing`, `feature-toggles` modules exist
- ~30 tenant-plane modules covering academics, student lifecycle, finance,
  communication, and several operational modules (library, transport, hostel,
  HR, payroll, cafeteria, health-wellness, discipline, alumni, LMS, etc.)
- Identity model: `User` is the auth anchor; `Student`/`Employee` link back
  via nullable FK, `ParentStudentLink` is the guardian join table. No
  separate `Person` entity — evaluated and kept as-is (see decision log).

## Known gaps (real, not hypothetical)
- [ ] No CI/CD pipeline exists (`.github/workflows` doesn't exist despite
      earlier docs claiming otherwise)
- [ ] No Dockerfile for the API or web app — only local `docker-compose.yml`
      for Postgres/Redis
- [ ] Tenant isolation is implemented but not covered by an explicit
      cross-tenant test suite (Tenant A vs Tenant B) — required before real
      student/fee data goes in
- [ ] `@nestjs/throttler` is a dependency but not wired into `app.module.ts`
- [ ] Test coverage is thin: 11 spec files across ~30 modules. Priority for
      more coverage: auth, tenant isolation, fees, attendance, exams
- [ ] Mobile apps (iOS/Android) not started — correctly deferred until the
      backend is pilot-proven

## Decision log
- **Identity model (User/Person/Student/Guardian/Employee)**: evaluated the
  existing User-anchored + nullable-FK pattern against the target
  User→Person→{Student,Guardian,Employee} model. Kept as-is — it achieves
  the same separation of auth vs. domain identity without a Person
  indirection layer, and refactoring it now would touch nearly every module
  for no pilot-visible benefit. Revisit only if a real requirement forces it
  (e.g. one person needing multiple concurrent domain roles).
- **Module scope for pilot launch**: Core (auth, tenants, campuses,
  academic-years, roles, users, students, admissions, classes, subjects,
  timetable, attendance, examinations, fees, communication, diary) +
  HR management + payroll are live. Everything else
  (activities, alumni, cafeteria, discipline, documents, health-wellness,
  hostel, inventory-assets, library, LMS, transportation) is feature-toggled
  off per-tenant, not deleted — code stays intact for later.
- **Hosting**: Render, chosen for low operational complexity (managed
  Postgres with backups, managed Redis, git-push deploy, auto TLS) over
  AWS/GCP, which would cost days on infra setup this timeline doesn't have.

## Next session should start with
1. Confirm the two `.bak` file deletions and doc rewrite are committed.
2. Write the tenant-isolation test suite (Tenant A cannot read/write
   Tenant B's students/fees/attendance) — this is the Day 2 gate before
   anything else in the plan proceeds.
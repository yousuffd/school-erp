'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UserRound } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Campus, Role, Student, StudentStatus } from '@/lib/types';

const STATUS_TONE: Record<StudentStatus, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  enrolled: 'info',
  active: 'success',
  transferred: 'warning',
  withdrawn: 'danger',
  graduated: 'neutral',
  alumni: 'neutral',
  duplicate: 'danger',
};

export default function StudentsPage() {
  const user = auth.getUser();
  // Client-side check for UX only (hide an action that would just 403) —
  // the backend's RbacGuard is the actual enforcement, this just avoids
  // showing a button that doesn't do anything useful for this role.
  const canCreate = isCoreAdminRole(user?.role);
  const [students, setStudents] = useState<Student[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    grade_level: '',
    section: '',
    campus_id: '',
    guardian_name: '',
    guardian_phone: '',
  });

  // Optional login creation — a Student record has no email field of its
  // own (confirmed before building this: the earlier test logins like
  // kabir.verma@... were separate User accounts manually linked via
  // student_id, with no UI path to do that anywhere). This lets both be
  // created together in one save, matching how it should have worked from
  // the start.
  const [createLogin, setCreateLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Students and campuses are fetched independently on purpose: a role like
    // Teacher can legitimately view students but has no core-admin permission
    // for campuses (used only to populate the "Add Student" form's dropdown).
    // Bundling them in one Promise.all meant a permission gap on the
    // secondary campuses call silently wiped out the primary student list
    // too, even though that role was fully entitled to see it.
    api
      .getStudents(user.tenantId!, { search })
      .then(setStudents)
      .catch((err) => setError(err.message));

    api
      .getCampuses(user.tenantId!)
      .then(setCampuses)
      .catch(() => {
        // Expected for roles without core-admin access (e.g. Teacher) — the
        // campus dropdown just won't populate for them, which is fine since
        // they don't have create permission on students either.
        setCampuses([]);
      })
      .finally(() => setLoading(false));

    api.getRoles(user.tenantId!).then(setRoles).catch(() => setRoles([]));
  }

  useEffect(load, [user?.tenantId]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    load();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // academic_year_id and enrollment_date use sensible current-year defaults;
      // a fuller Admissions flow (Phase 1, not yet built) will replace this
      // quick-add form with a proper enrollment wizard.
      const years = await api.getAcademicYears(user.tenantId!);
      const currentYear = years.find((y) => y.is_current) ?? years[0];
      if (!currentYear) {
        setError('No academic year exists yet — create one under Settings first.');
        setSaving(false);
        return;
      }
      const created = await api.createStudent({
        tenant_id: user.tenantId!,
        campus_id: form.campus_id,
        admission_number: form.admission_number || undefined,
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender as Student['gender'],
        grade_level: form.grade_level,
        section: form.section || undefined,
        academic_year_id: currentYear.id,
        enrollment_date: new Date().toISOString().slice(0, 10),
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
      });

      if (createLogin) {
        const studentRole = roles.find((r) => r.name === 'Student');
        if (!studentRole) {
          setError('Student created, but no "Student" role exists in this tenant — login was not created.');
        } else {
          await api.createUser({
            tenant_id: user.tenantId!,
            role_id: studentRole.id,
            student_id: created.id,
            campus_id: form.campus_id || undefined,
            name: `${form.first_name} ${form.last_name}`,
            email: loginEmail,
            password: loginPassword || undefined,
          });
        }
      }

      setShowForm(false);
      setForm({
        admission_number: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'prefer_not_to_say',
        grade_level: '',
        section: '',
        campus_id: '',
        guardian_name: '',
        guardian_phone: '',
      });
      setCreateLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create student');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Student Directory" description="Core student profiles — the record everything else attaches to." />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card
          title="All Students"
          action={
            canCreate && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> Add Student
              </Button>
            )
          }
        >
          <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission number..."
                className="w-full rounded-button border border-border py-2 pl-9 pr-3 text-body"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {showForm && canCreate && (
            <form
              onSubmit={handleCreate}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-caption text-text-secondary">
                  Admission Number <span className="font-normal text-text-secondary/70">(optional — auto-generated if left blank)</span>
                </label>
                <input
                  value={form.admission_number}
                  onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                  placeholder="Leave blank for ADM-2026-001 style auto-generation"
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">First Name</label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Last Name</label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Date of Birth</label>
                <input
                  required
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Grade Level</label>
                <input
                  required
                  value={form.grade_level}
                  onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                  placeholder="Grade 5"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Section (optional)</label>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="A"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Campus</label>
                <select
                  required
                  value={form.campus_id}
                  onChange={(e) => setForm({ ...form, campus_id: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  <option value="">Select a campus</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Guardian Name</label>
                <input
                  required
                  value={form.guardian_name}
                  onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Guardian Phone</label>
                <input
                  required
                  value={form.guardian_phone}
                  onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div className="sm:col-span-3 rounded-card border border-border bg-canvas p-4">
                <label className="flex items-center gap-2 text-body text-text-primary">
                  <input
                    type="checkbox"
                    checked={createLogin}
                    onChange={(e) => setCreateLogin(e.target.checked)}
                  />
                  Also create a login for this student
                </label>
                {createLogin && (
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-caption text-text-secondary">Login Email</label>
                      <input
                        required={createLogin}
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-button border border-border px-3 py-2 text-body"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-caption text-text-secondary">
                        Password <span className="font-normal text-text-secondary/70">(optional — leave blank to invite)</span>
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-button border border-border px-3 py-2 text-body"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Student'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : students.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">
              No students yet — add one to get started.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Admission #</th>
                  <th className="py-2 pr-4 font-medium">Grade</th>
                  <th className="py-2 pr-4 font-medium">Guardian</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/students/${s.id}`} className="flex items-center gap-2 hover:underline">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent">
                          <UserRound size={16} />
                        </div>
                        <span className="font-medium text-text-primary">
                          {s.first_name} {s.last_name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">
                      {s.admission_number}
                    </td>
                    <td className="py-3 pr-4 text-body text-text-secondary">
                      {s.grade_level}
                      {s.section ? ` - ${s.section}` : ''}
                    </td>
                    <td className="py-3 pr-4 text-body text-text-secondary">{s.guardian_name}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

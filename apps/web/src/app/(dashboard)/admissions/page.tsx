'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Admission, AdmissionStage, Campus } from '@/lib/types';

const STAGE_TONE: Record<AdmissionStage, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  inquiry: 'neutral',
  application_submitted: 'info',
  under_review: 'warning',
  waitlisted: 'warning',
  approved: 'success',
  rejected: 'danger',
  enrolled: 'success',
  withdrawn: 'neutral',
};

const STAGE_FILTERS: { label: string; value: AdmissionStage | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Submitted', value: 'application_submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Waitlisted', value: 'waitlisted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Enrolled', value: 'enrolled' },
];

export default function AdmissionsPage() {
  const user = auth.getUser();
  const canCreate = isCoreAdminRole(user?.role);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<AdmissionStage | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    applicant_first_name: '',
    applicant_last_name: '',
    date_of_birth: '',
    desired_grade_level: '',
    campus_id: '',
    guardian_name: '',
    guardian_phone: '',
  });

  function load() {
    if (!user) return;
    setLoading(true);
    setError(null);

    api
      .getAdmissions(user.tenantId!, { search, stage: stageFilter || undefined })
      .then(setAdmissions)
      .catch((err) => setError(err.message));

    api
      .getCampuses(user.tenantId!)
      .then(setCampuses)
      .catch(() => setCampuses([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId, stageFilter]);

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
      const years = await api.getAcademicYears(user.tenantId!);
      const currentYear = years.find((y) => y.is_current) ?? years[0];
      if (!currentYear) {
        setError('No academic year exists yet — create one under Settings first.');
        setSaving(false);
        return;
      }
      await api.createAdmission({
        tenant_id: user.tenantId!,
        campus_id: form.campus_id,
        academic_year_id: currentYear.id,
        applicant_first_name: form.applicant_first_name,
        applicant_last_name: form.applicant_last_name,
        date_of_birth: form.date_of_birth,
        desired_grade_level: form.desired_grade_level,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        source: 'other',
      });
      setShowForm(false);
      setForm({
        applicant_first_name: '',
        applicant_last_name: '',
        date_of_birth: '',
        desired_grade_level: '',
        campus_id: '',
        guardian_name: '',
        guardian_phone: '',
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create admission');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title="Admissions"
        description="Inquiry-to-enrollment pipeline. Approve an application, then enroll it to create the student record."
      />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card
          title="Pipeline"
          action={
            canCreate && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Inquiry
              </Button>
            )
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {STAGE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setStageFilter(f.value)}
                className={
                  stageFilter === f.value
                    ? 'rounded-full bg-accent px-3 py-1 text-caption font-medium text-white'
                    : 'rounded-full bg-canvas px-3 py-1 text-caption text-text-secondary hover:bg-border'
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by applicant name..."
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
                <label className="mb-1 block text-caption text-text-secondary">First Name</label>
                <input
                  required
                  value={form.applicant_first_name}
                  onChange={(e) => setForm({ ...form, applicant_first_name: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Last Name</label>
                <input
                  required
                  value={form.applicant_last_name}
                  onChange={(e) => setForm({ ...form, applicant_last_name: e.target.value })}
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
                <label className="mb-1 block text-caption text-text-secondary">Desired Grade</label>
                <input
                  required
                  value={form.desired_grade_level}
                  onChange={(e) => setForm({ ...form, desired_grade_level: e.target.value })}
                  placeholder="Grade 5"
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
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Inquiry'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : admissions.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">
              No applications yet — add one to get started.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Applicant</th>
                  <th className="py-2 pr-4 font-medium">Desired Grade</th>
                  <th className="py-2 pr-4 font-medium">Guardian</th>
                  <th className="py-2 pr-4 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admissions/${a.id}`} className="flex items-center gap-2 hover:underline">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent">
                          <ClipboardList size={16} />
                        </div>
                        <span className="font-medium text-text-primary">
                          {a.applicant_first_name} {a.applicant_last_name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-body text-text-secondary">{a.desired_grade_level}</td>
                    <td className="py-3 pr-4 text-body text-text-secondary">{a.guardian_name}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={STAGE_TONE[a.stage]}>{a.stage.replace(/_/g, ' ')}</Badge>
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

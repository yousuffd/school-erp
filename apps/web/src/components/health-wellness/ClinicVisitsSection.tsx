'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { ClinicVisit, SchoolClass, Student } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

interface Props {
  tenantId: string;
  canEdit: boolean;
}

export function ClinicVisitsSection({ tenantId, canEdit }: Props) {
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [reason, setReason] = useState('');
  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTreatment, setEditTreatment] = useState('');
  const [editFollowUp, setEditFollowUp] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.getClinicVisits(tenantId), api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([v, s, c]) => {
        setVisits(v);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setVisitDate('');
    setReason('');
    setTreatmentGiven('');
    setFollowUpRequired(false);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createClinicVisit({
        tenant_id: tenantId,
        student_id: studentId,
        visit_date: new Date(visitDate).toISOString(),
        reason,
        treatment_given: treatmentGiven || undefined,
        follow_up_required: followUpRequired,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create visit');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(v: ClinicVisit) {
    setEditingId(v.id);
    setEditTreatment(v.treatment_given ?? '');
    setEditFollowUp(v.follow_up_required);
  }

  async function handleSaveEdit(id: string) {
    setSavingEdit(true);
    setError(null);
    try {
      await api.updateClinicVisit(id, { treatment_given: editTreatment || undefined, follow_up_required: editFollowUp });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update visit');
    } finally {
      setSavingEdit(false);
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Clinic Visits"
        action={
          canEdit ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Log Visit
            </Button>
          ) : undefined
        }
      >
        {canEdit && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Visit Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-body text-text-primary">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                />
                Follow-up required
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Reason</label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Treatment Given</label>
              <textarea
                value={treatmentGiven}
                onChange={(e) => setTreatmentGiven(e.target.value)}
                rows={2}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Log Visit'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : visits.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No clinic visits logged yet.</p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div key={v.id} className="rounded-card border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-body font-medium text-text-primary">{studentName(v.student_id)}</span>
                    <span className="ml-2 font-mono text-caption text-text-secondary">
                      {new Date(v.visit_date).toLocaleString()}
                    </span>
                  </div>
                  {v.follow_up_required && (
                    <Badge tone="warning">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={12} /> Follow-up required
                      </span>
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-body text-text-primary">{v.reason}</p>
                {editingId === v.id ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <textarea
                      placeholder="Treatment given"
                      value={editTreatment}
                      onChange={(e) => setEditTreatment(e.target.value)}
                      className="rounded-button border border-border px-2 py-1.5 text-body sm:col-span-2"
                    />
                    <label className="flex items-center gap-2 text-caption text-text-secondary">
                      <input type="checkbox" checked={editFollowUp} onChange={(e) => setEditFollowUp(e.target.checked)} />
                      Follow-up required
                    </label>
                    <div className="flex gap-2 sm:col-span-3">
                      <Button onClick={() => handleSaveEdit(v.id)} disabled={savingEdit}>
                        {savingEdit ? 'Saving…' : 'Save'}
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {v.treatment_given && (
                      <p className="mt-1 text-caption text-text-secondary">Treatment: {v.treatment_given}</p>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => startEdit(v)}
                        className="mt-2 text-caption font-medium text-accent hover:underline"
                      >
                        Edit treatment / follow-up
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

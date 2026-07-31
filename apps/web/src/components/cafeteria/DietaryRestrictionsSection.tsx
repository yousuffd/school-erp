'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { DietaryRestrictionType, SchoolClass, Student, StudentDietaryRestriction } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

interface Props {
  tenantId: string;
}

const RESTRICTION_TYPES: DietaryRestrictionType[] = ['allergy', 'vegetarian', 'vegan', 'religious', 'other'];
const TYPE_TONE: Record<DietaryRestrictionType, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  allergy: 'danger',
  vegetarian: 'success',
  vegan: 'success',
  religious: 'info',
  other: 'neutral',
};

export function DietaryRestrictionsSection({ tenantId }: Props) {
  const [restrictions, setRestrictions] = useState<StudentDietaryRestriction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [restrictionType, setRestrictionType] = useState<DietaryRestrictionType>('vegetarian');
  const [details, setDetails] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.getDietaryRestrictions(tenantId), api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([r, s, c]) => {
        setRestrictions(r);
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
    setRestrictionType('vegetarian');
    setDetails('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDietaryRestriction({
        tenant_id: tenantId,
        student_id: studentId,
        restriction_type: restrictionType,
        details,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create dietary restriction');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteDietaryRestriction(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete dietary restriction');
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
        title="Student Dietary Restrictions"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Restriction
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Type</label>
              <select
                value={restrictionType}
                onChange={(e) => setRestrictionType(e.target.value as DietaryRestrictionType)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {RESTRICTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Details</label>
              <input
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. No dairy or eggs"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Restriction'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : restrictions.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No dietary restrictions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Details</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {restrictions.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">
                      {studentName(r.student_id)}
                    </td>
                    <td className="py-2 px-3">
                      <Badge tone={TYPE_TONE[r.restriction_type]}>{r.restriction_type}</Badge>
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{r.details}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Delete restriction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

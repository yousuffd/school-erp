'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { BloodGroup, SchoolClass, Student, StudentHealthProfile } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

interface Props {
  tenantId: string;
  canEdit: boolean;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

export function ProfilesSection({ tenantId, canEdit }: Props) {
  const [profiles, setProfiles] = useState<StudentHealthProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('unknown');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.getHealthProfiles(tenantId), api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([p, s, c]) => {
        setProfiles(p);
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
    setBloodGroup('unknown');
    setAllergies('');
    setChronicConditions('');
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.upsertHealthProfile({
        tenant_id: tenantId,
        student_id: studentId,
        blood_group: bloodGroup,
        allergies: allergies || undefined,
        chronic_conditions: chronicConditions || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
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
        title="Student Health Profiles"
        action={
          canEdit ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Add / Update Profile
            </Button>
          ) : undefined
        }
      >
        {canEdit && showForm && (
          <form
            onSubmit={handleSave}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Allergies</label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                placeholder="e.g. Peanuts, penicillin"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Chronic Conditions</label>
              <textarea
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                rows={2}
                placeholder="e.g. Asthma"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No health profiles recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Blood Group</th>
                  <th className="py-2 px-3 font-medium">Allergies</th>
                  <th className="py-2 px-3 font-medium">Chronic Conditions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">
                      {studentName(p.student_id)}
                    </td>
                    <td className="py-2 px-3">
                      <Badge tone={p.blood_group === 'unknown' ? 'neutral' : 'info'}>{p.blood_group}</Badge>
                    </td>
                    <td className="py-2 px-3 text-body text-text-primary">
                      {p.allergies ? <Badge tone="warning">{p.allergies}</Badge> : '—'}
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{p.chronic_conditions ?? '—'}</td>
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

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { Activity, ActivityRoster, Student, SchoolClass } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

export function RosterSection() {
  const user = auth.getUser();
  const canEdit = hasPermission(user, 'activities', 'edit');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [roster, setRoster] = useState<ActivityRoster[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [joinedDate, setJoinedDate] = useState('');

  function loadBase() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getActivities(user.tenantId!), api.getStudents(user.tenantId!), api.getClasses(user.tenantId!)])
      .then(([a, s, c]) => {
        setActivities(a);
        setStudents(s);
        setClasses(c);
        setSelectedActivityId((prev) => prev || (a[0]?.id ?? ''));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(loadBase, [user?.tenantId]);

  function loadRoster() {
    if (!selectedActivityId) {
      setRoster([]);
      return;
    }
    api
      .getActivityRoster(selectedActivityId)
      .then(setRoster)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load roster'));
  }

  useEffect(loadRoster, [selectedActivityId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setJoinedDate('');
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedActivityId) return;
    setSaving(true);
    setError(null);
    try {
      await api.addToActivityRoster(selectedActivityId, {
        tenant_id: user.tenantId!,
        student_id: studentId,
        joined_date: joinedDate,
      });
      resetForm();
      loadRoster();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add student to roster');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      await api.removeFromActivityRoster(id);
      loadRoster();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove roster entry');
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Activity Rosters"
        action={
          canEdit && selectedActivityId ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Add Student
            </Button>
          ) : undefined
        }
      >
        <div className="mb-4">
          <label className="mb-1 block text-caption text-text-secondary">Activity</label>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full max-w-sm rounded-button border border-border px-3 py-2 text-body"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {canEdit && showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Joined Date</label>
              <input
                required
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !studentId}>
                {saving ? 'Adding…' : 'Add to Roster'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : roster.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No students on this roster yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Joined</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{studentName(r.student_id)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{r.joined_date}</td>
                    <td className="py-2 px-3">
                      {canEdit && (
                        <button onClick={() => handleRemove(r.id)} className="text-text-secondary hover:text-danger" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
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
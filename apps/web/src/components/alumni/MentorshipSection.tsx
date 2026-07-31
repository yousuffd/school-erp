'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { AlumniProfile, MentorshipMatch, MentorshipMatchStatus, SchoolClass, Student } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';
import { alumniLabel } from './alumni-helpers';

export function MentorshipSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'alumni', 'create');
  const canEdit = hasPermission(user, 'alumni', 'edit');
  const canDelete = hasPermission(user, 'alumni', 'delete');

  const [matches, setMatches] = useState<MentorshipMatch[]>([]);
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mentorAlumniId, setMentorAlumniId] = useState('');
  const [menteeStudentId, setMenteeStudentId] = useState('');
  const [notes, setNotes] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getMentorshipMatches(user.tenantId!),
      api.getAlumniProfiles(user.tenantId!),
      api.getStudents(user.tenantId!),
      api.getClasses(user.tenantId!),
    ])
      .then(([m, p, s, c]) => {
        setMatches(m);
        setProfiles(p);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setMentorAlumniId('');
    setMenteeStudentId('');
    setNotes('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createMentorshipMatch({
        tenant_id: user.tenantId!,
        mentor_alumni_id: mentorAlumniId,
        mentee_student_id: menteeStudentId,
        notes: notes || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create mentorship match');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: MentorshipMatchStatus) {
    setError(null);
    try {
      await api.updateMentorshipMatchStatus(id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteMentorshipMatch(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete match');
    }
  }

  function profileFor(id: string) {
    return profiles.find((p) => p.id === id);
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
        title="Mentorship Matches"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> New Match
            </Button>
          ) : undefined
        }
      >
        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Mentor (Alumnus)</label>
              <select
                required
                value={mentorAlumniId}
                onChange={(e) => setMentorAlumniId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select alumnus…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{alumniLabel(p, students)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Mentee (Current Student)</label>
              <StudentPicker students={students} classes={classes} value={menteeStudentId} onChange={setMenteeStudentId} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !mentorAlumniId || !menteeStudentId}>
                {saving ? 'Saving…' : 'Create Match'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : matches.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No mentorship matches yet.</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-card border border-border p-3">
                <div>
                  <p className="text-body text-text-primary">
                    {alumniLabel(profileFor(m.mentor_alumni_id), students)}
                    <span className="text-text-secondary"> mentoring </span>
                    {studentName(m.mentee_student_id)}
                  </p>
                  {m.notes && <p className="text-caption text-text-secondary">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.status === 'completed' ? 'success' : 'warning'}>{m.status}</Badge>
                  {canEdit && (
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value as MentorshipMatchStatus)}
                      className="rounded-button border border-border px-2 py-1 text-caption"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(m.id)} className="text-text-secondary hover:text-danger" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
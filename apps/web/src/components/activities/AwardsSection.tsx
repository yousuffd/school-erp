'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, Award as AwardIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { Award, SchoolEvent, Student, SchoolClass } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

export function AwardsSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'activities', 'create');
  const canDelete = hasPermission(user, 'activities', 'delete');

  const [awards, setAwards] = useState<Award[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [awardedDate, setAwardedDate] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getAwards(user.tenantId!, filterStudentId || undefined),
      api.getEvents(user.tenantId!),
      api.getStudents(user.tenantId!),
      api.getClasses(user.tenantId!),
    ])
      .then(([aw, ev, s, c]) => {
        setAwards(aw);
        setEvents(ev);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId, filterStudentId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setEventId('');
    setTitle('');
    setAwardedDate('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createAward({
        tenant_id: user.tenantId!,
        student_id: studentId,
        event_id: eventId || undefined,
        title,
        awarded_date: awardedDate,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create award');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteAward(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete award');
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function eventName(id?: string | null) {
    if (!id) return null;
    return events.find((e) => e.id === id)?.name ?? null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Awards & Certificates"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> Issue Award
            </Button>
          ) : undefined
        }
      >
        <div className="mb-4 max-w-sm">
          <label className="mb-1 block text-caption text-text-secondary">Filter by Student</label>
          <StudentPicker students={students} classes={classes} value={filterStudentId} onChange={setFilterStudentId} />
        </div>

        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Awarded Date</label>
              <input required type="date" value={awardedDate} onChange={(e) => setAwardedDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Linked Event (optional)</label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                <option value="">None</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !studentId}>{saving ? 'Saving…' : 'Issue Award'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : awards.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No awards yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Title</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Event</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {awards.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{studentName(a.student_id)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <AwardIcon size={14} className="text-accent" />
                        {a.title}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{a.awarded_date}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{eventName(a.event_id) ?? '—'}</td>
                    <td className="py-2 px-3">
                      {canDelete && (
                        <button onClick={() => handleDelete(a.id)} className="text-text-secondary hover:text-danger" title="Delete">
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
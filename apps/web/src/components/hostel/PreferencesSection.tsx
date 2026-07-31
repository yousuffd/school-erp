'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { HostelRoomPreference, Student } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function PreferencesSection({ tenantId }: Props) {
  const [preferences, setPreferences] = useState<HostelRoomPreference[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{ matched: number; unmatched: number } | null>(null);

  const [studentId, setStudentId] = useState('');
  const [preferredRoommateId, setPreferredRoommateId] = useState('');
  const [preferredFloor, setPreferredFloor] = useState('');
  const [notes, setNotes] = useState('');

  function studentLabel(id: string | null) {
    if (!id) return '—';
    const s = students.find((s) => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelRoomPreferences(tenantId), api.getStudents(tenantId)])
      .then(([p, s]) => {
        setPreferences(p);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load preferences'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createHostelRoomPreference({
        tenant_id: tenantId,
        student_id: studentId,
        preferred_roommate_id: preferredRoommateId || undefined,
        preferred_floor: preferredFloor ? Number(preferredFloor) : undefined,
        notes: notes || undefined,
      });
      setStudentId('');
      setPreferredRoommateId('');
      setPreferredFloor('');
      setNotes('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save preference');
    } finally {
      setSaving(false);
    }
  }

  async function handleRunMatching() {
    setMatching(true);
    setError(null);
    try {
      const result = await api.runHostelRoomMatching(tenantId);
      setMatchResult(result);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to run matching');
    } finally {
      setMatching(false);
    }
  }

  return (
    <Card
      title="Roommate Matching"
      action={
        <div className="flex items-center gap-2">
          <Button onClick={handleRunMatching} disabled={matching} className="flex items-center gap-1.5">
            <Sparkles size={16} /> {matching ? 'Matching…' : 'Run Matching'}
          </Button>
          <Button variant="secondary" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Preference
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {matchResult && (
        <div className="mb-4 rounded-card border border-accent/20 bg-accent-light p-4 text-body text-text-primary">
          Matching complete — <strong>{matchResult.matched}</strong> students matched,{' '}
          <strong>{matchResult.unmatched}</strong> still unmatched.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Student</label>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Preferred Roommate</label>
            <select
              value={preferredRoommateId}
              onChange={(e) => setPreferredRoommateId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Optional — none</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Preferred Floor</label>
            <input
              type="number"
              value={preferredFloor}
              onChange={(e) => setPreferredFloor(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Preference'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : preferences.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No preferences submitted yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Preferred Roommate</th>
              <th className="py-2 pr-4 font-medium">Preferred Floor</th>
              <th className="py-2 pr-4 font-medium">Matched</th>
            </tr>
          </thead>
          <tbody>
            {preferences.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-body text-text-primary">{studentLabel(p.student_id)}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{studentLabel(p.preferred_roommate_id)}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{p.preferred_floor ?? '—'}</td>
                <td className="py-3 pr-4">
                  {p.matched_room_id ? <Badge tone="success">Matched</Badge> : <Badge tone="warning">Unmatched</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
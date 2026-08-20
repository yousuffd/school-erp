'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { HostelRoom, HostelRoomAllocation, Student } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

export function AllocationsSection({ tenantId }: Props) {
  const [allocations, setAllocations] = useState<HostelRoomAllocation[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  function roomLabel(id: string) {
    const r = rooms.find((r) => r.id === id);
    return r ? `${r.building_name} — ${r.room_number}` : id;
  }
  function studentLabel(id: string) {
    const s = students.find((s) => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelAllocations(tenantId), api.getHostelRooms(tenantId), api.getStudents(tenantId)])
      .then(([a, r, s]) => {
        setAllocations(a);
        setRooms(r);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load allocations'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createHostelAllocation({
        tenant_id: tenantId,
        room_id: roomId,
        student_id: studentId,
        academic_year_id: academicYearId,
        allocated_date: new Date().toISOString().slice(0, 10),
      });
      setRoomId('');
      setStudentId('');
      setAcademicYearId('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create allocation');
    } finally {
      setSaving(false);
    }
  }

  async function handleVacate(id: string) {
    try {
      await api.vacateHostelAllocation(id, new Date().toISOString().slice(0, 10));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to vacate allocation');
    }
  }

  return (
    <Card
      title="Room Allocations"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Allocation
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Room</label>
            <select
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select a room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.building_name} — {r.room_number} ({r.capacity} beds)
                </option>
              ))}
            </select>
          </div>
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
            <label className="mb-1 block text-caption text-text-secondary">Academic Year ID</label>
            <input
              required
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              placeholder="Academic Year UUID"
              className="w-full rounded-button border border-border px-3 py-2 text-body font-mono text-caption"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Allocate'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : allocations.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No allocations yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Room</th>
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Allocated</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">{roomLabel(a.room_id)}</td>
                <td className="py-3 pr-4 text-body text-text-primary">{studentLabel(a.student_id)}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{a.allocated_date}</td>
                <td className="py-3 pr-4">
                  {a.status === 'active' ? <Badge tone="success">Active</Badge> : <Badge>Vacated</Badge>}
                </td>
                <td className="py-3 pr-4 text-right">
                  {a.status === 'active' && (
                    <button
                      onClick={() => handleVacate(a.id)}
                      aria-label="Vacate allocation"
                      className="flex items-center gap-1 text-caption text-text-secondary hover:text-danger"
                    >
                      <LogOut size={14} /> Vacate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { BookReservation, BookWithAvailability, ReservationStatus, SchoolClass, Student } from '@/lib/types';
import { StudentPicker } from './StudentPicker';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<ReservationStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'warning',
  fulfilled: 'success',
  cancelled: 'neutral',
};

export function ReservationsView({ tenantId }: Props) {
  const [reservations, setReservations] = useState<BookReservation[]>([]);
  const [books, setBooks] = useState<BookWithAvailability[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [bookId, setBookId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.getReservations(tenantId),
      api.getBooks(tenantId, {}),
      api.getStudents(tenantId),
      api.getClasses(tenantId),
    ])
      .then(([r, b, s, c]) => {
        setReservations(r);
        setBooks(b);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function bookTitle(id: string) {
    return books.find((b) => b.id === id)?.title ?? '—';
  }
  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  function resetForm() {
    setShowForm(false);
    setBookId('');
    setStudentId('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createReservation({ tenant_id: tenantId, book_id: bookId, student_id: studentId });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create reservation');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    setError(null);
    try {
      await api.cancelReservation(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel reservation');
    }
  }

  const sorted = useMemo(
    () => [...reservations].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [reservations],
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Reservations"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Reservation
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Book</label>
              <select
                required
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.available_copies} available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Reserve'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
            <p className="text-caption text-text-secondary sm:col-span-3">
              Only allowed when the book has zero available copies — if copies are available, issue one directly
              instead.
            </p>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No reservations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Book</th>
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{bookTitle(r.book_id)}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{studentName(r.student_id)}</td>
                    <td className="py-2 px-3">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="flex items-center gap-1 text-caption font-medium text-danger hover:underline"
                        >
                          <XCircle size={12} /> Cancel
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

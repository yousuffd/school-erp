'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { BookIssue, BookWithAvailability, SchoolClass, Student } from '@/lib/types';
import { StudentPicker } from './StudentPicker';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

function isOverdue(issue: BookIssue): boolean {
  if (issue.return_date) return false;
  return issue.due_date < new Date().toISOString().slice(0, 10);
}

export function IssuesView({ tenantId }: Props) {
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [books, setBooks] = useState<BookWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [issueMode, setIssueMode] = useState<'barcode' | 'title'>('barcode');
  const [issueBarcode, setIssueBarcode] = useState('');
  const [issueBookId, setIssueBookId] = useState('');
  const [issueStudentId, setIssueStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [issuing, setIssuing] = useState(false);

  const [returnBarcode, setReturnBarcode] = useState('');
  const [returning, setReturning] = useState(false);

  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.getBookIssues(tenantId, { overdueOnly: showOverdueOnly }),
      api.getStudents(tenantId),
      api.getBooks(tenantId, {}),
      api.getClasses(tenantId),
    ])
      .then(([i, s, b, c]) => {
        setIssues(i);
        setStudents(s);
        setBooks(b);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId, showOverdueOnly]);

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  function resetIssueForm() {
    setIssueBarcode('');
    setIssueBookId('');
    setIssueStudentId('');
    setDueDate('');
  }

  async function handleIssue(e: FormEvent) {
    e.preventDefault();
    setIssuing(true);
    setError(null);
    setNotice(null);
    try {
      await api.issueBook({
        tenant_id: tenantId,
        student_id: issueStudentId,
        due_date: dueDate,
        barcode: issueMode === 'barcode' ? issueBarcode : undefined,
        book_id: issueMode === 'title' ? issueBookId : undefined,
      });
      setNotice('Book issued successfully.');
      resetIssueForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  }

  async function handleReturn(e: FormEvent) {
    e.preventDefault();
    setReturning(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.returnBook({ barcode: returnBarcode });
      setNotice(
        result.fine_amount ? `Returned. Overdue fine: ₹${result.fine_amount}.` : 'Returned — no fine, on time.',
      );
      setReturnBarcode('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to return book');
    } finally {
      setReturning(false);
    }
  }

  const sortedIssues = useMemo(
    () => [...issues].sort((a, b) => (a.due_date < b.due_date ? 1 : -1)),
    [issues],
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      {notice && (
        <div className="rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">{notice}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Issue a Book">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIssueMode('barcode')}
              className={
                issueMode === 'barcode'
                  ? 'rounded-button bg-accent px-3 py-1.5 text-caption font-medium text-white'
                  : 'rounded-button border border-border px-3 py-1.5 text-caption font-medium text-text-secondary'
              }
            >
              By Barcode
            </button>
            <button
              type="button"
              onClick={() => setIssueMode('title')}
              className={
                issueMode === 'title'
                  ? 'rounded-button bg-accent px-3 py-1.5 text-caption font-medium text-white'
                  : 'rounded-button border border-border px-3 py-1.5 text-caption font-medium text-text-secondary'
              }
            >
              By Title
            </button>
          </div>
          <form onSubmit={handleIssue} className="space-y-3">
            {issueMode === 'barcode' ? (
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Barcode</label>
                <input
                  required
                  value={issueBarcode}
                  onChange={(e) => setIssueBarcode(e.target.value)}
                  placeholder="Scan or type barcode…"
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Book</label>
                <select
                  required
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  <option value="">Select…</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.available_copies === 0}>
                      {b.title} ({b.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker
                students={students}
                classes={classes}
                value={issueStudentId}
                onChange={setIssueStudentId}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Due Date</label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={issuing} className="flex items-center gap-1.5">
                <Send size={16} /> {issuing ? 'Issuing…' : 'Issue Book'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetIssueForm} disabled={issuing}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Return a Book">
          <form onSubmit={handleReturn} className="space-y-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Barcode</label>
              <input
                required
                value={returnBarcode}
                onChange={(e) => setReturnBarcode(e.target.value)}
                placeholder="Scan or type barcode…"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <Button type="submit" disabled={returning} className="flex items-center gap-1.5">
              <RotateCcw size={16} /> {returning ? 'Processing…' : 'Return Book'}
            </Button>
          </form>
        </Card>
      </div>

      <Card
        title="Current & Recent Issues"
        action={
          <label className="flex items-center gap-2 text-caption text-text-secondary">
            <input type="checkbox" checked={showOverdueOnly} onChange={(e) => setShowOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
        }
      >
        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : sortedIssues.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No issues found.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Issued</th>
                  <th className="py-2 px-3 font-medium">Due</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Fine</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body text-text-primary">{studentName(i.student_id)}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{i.issue_date}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{i.due_date}</td>
                    <td className="py-2 px-3">
                      {i.return_date ? (
                        <Badge tone="success">Returned {i.return_date}</Badge>
                      ) : isOverdue(i) ? (
                        <Badge tone="danger">
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} /> Overdue
                          </span>
                        </Badge>
                      ) : (
                        <Badge tone="info">Out</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">
                      {i.fine_amount ? `₹${i.fine_amount}${i.fine_paid ? ' (paid)' : ''}` : '—'}
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

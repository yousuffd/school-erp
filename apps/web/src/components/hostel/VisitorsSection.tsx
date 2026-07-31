'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, ShieldCheck, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { HostelVisitor, Student } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function VisitorsSection({ tenantId }: Props) {
  const [visitors, setVisitors] = useState<HostelVisitor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [relation, setRelation] = useState('');
  const [purpose, setPurpose] = useState('');

  function studentLabel(id: string) {
    const s = students.find((s) => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelVisitors(tenantId), api.getStudents(tenantId)])
      .then(([v, s]) => {
        setVisitors(v);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load visitors'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createHostelVisitor({
        tenant_id: tenantId,
        student_id: studentId,
        visitor_name: visitorName,
        relation,
        purpose: purpose || undefined,
        check_in_time: new Date().toISOString(),
      });
      setStudentId('');
      setVisitorName('');
      setRelation('');
      setPurpose('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log visitor');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(id: string) {
    try {
      await api.verifyHostelVisitor(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to verify visitor');
    }
  }

  async function handleCheckOut(id: string) {
    try {
      await api.checkOutHostelVisitor(id, new Date().toISOString());
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check out visitor');
    }
  }

  return (
    <Card
      title="Visitors"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> Log Visitor
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
            <label className="mb-1 block text-caption text-text-secondary">Visitor Name</label>
            <input
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Relation</label>
            <input
              required
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Uncle, Sister…"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Purpose</label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Logging…' : 'Log Check-In'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : visitors.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No visitors logged yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Visitor</th>
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Relation</th>
              <th className="py-2 pr-4 font-medium">Pass Code</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">{v.visitor_name}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{studentLabel(v.student_id)}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{v.relation}</td>
                <td className="py-3 pr-4 font-mono text-caption text-text-secondary">{v.pass_code ?? '—'}</td>
                <td className="py-3 pr-4">
                  {v.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
                  {v.check_out_time && <Badge tone="info">Checked out</Badge>}
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!v.verified && (
                      <button
                        onClick={() => handleVerify(v.id)}
                        aria-label={`Verify ${v.visitor_name}'s pass`}
                        className="flex items-center gap-1 text-caption text-accent hover:opacity-80"
                      >
                        <ShieldCheck size={14} /> Verify
                      </button>
                    )}
                    {!v.check_out_time && (
                      <button
                        onClick={() => handleCheckOut(v.id)}
                        aria-label={`Check out ${v.visitor_name}`}
                        className="flex items-center gap-1 text-caption text-text-secondary hover:text-text-primary"
                      >
                        <LogOut size={14} /> Check Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
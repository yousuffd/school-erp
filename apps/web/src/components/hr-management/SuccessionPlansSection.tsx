'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { SuccessionPlan, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

const READINESS_LABEL: Record<NonNullable<SuccessionPlan['readiness_level']>, string> = {
  ready_now: 'Ready Now',
  ready_1_2_years: 'Ready in 1–2 Years',
  developing: 'Developing',
};

const READINESS_TONE: Record<NonNullable<SuccessionPlan['readiness_level']>, 'success' | 'warning' | 'info'> = {
  ready_now: 'success',
  ready_1_2_years: 'warning',
  developing: 'info',
};

export function SuccessionPlansSection({ tenantId }: Props) {
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [positionEmployeeId, setPositionEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

  function employeeLabel(id: string | null) {
    if (!id) return '—';
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getSuccessionPlans(tenantId), api.getEmployees(tenantId)])
      .then(([p, e]) => {
        setPlans(p);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load succession plans'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createSuccessionPlan({ tenant_id: tenantId, position_employee_id: positionEmployeeId, notes: notes || undefined });
      setPositionEmployeeId('');
      setNotes('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create succession plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, patch: { successor_employee_id?: string; readiness_level?: SuccessionPlan['readiness_level'] }) {
    try {
      await api.updateSuccessionPlan(id, patch);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update succession plan');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteSuccessionPlan(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete succession plan');
    }
  }

  return (
    <Card
      title="Succession Planning"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Plan
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Position (Employee)</label>
            <select required value={positionEmployeeId} onChange={(e) => setPositionEmployeeId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
              <option value="">Select an employee</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} — {emp.designation}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Plan'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No succession plans yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Position</th>
              <th className="py-2 pr-4 font-medium">Successor</th>
              <th className="py-2 pr-4 font-medium">Readiness</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">{employeeLabel(p.position_employee_id)}</td>
                <td className="py-3 pr-4">
                  <select
                    value={p.successor_employee_id ?? ''}
                    onChange={(e) => handleUpdate(p.id, { successor_employee_id: e.target.value || undefined })}
                    className="rounded-button border border-border px-2 py-1 text-caption"
                  >
                    <option value="">None</option>
                    {employees.filter((e) => e.id !== p.position_employee_id).map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-4">
                  <select
                    value={p.readiness_level ?? ''}
                    onChange={(e) => handleUpdate(p.id, { readiness_level: (e.target.value || undefined) as SuccessionPlan['readiness_level'] })}
                    className="rounded-button border border-border px-2 py-1 text-caption"
                  >
                    <option value="">Not set</option>
                    <option value="ready_now">Ready Now</option>
                    <option value="ready_1_2_years">Ready in 1–2 Years</option>
                    <option value="developing">Developing</option>
                  </select>
                  {p.readiness_level && (
                    <span className="ml-2">
                      <Badge tone={READINESS_TONE[p.readiness_level]}>{READINESS_LABEL[p.readiness_level]}</Badge>
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right">
                  <button onClick={() => handleDelete(p.id)} aria-label="Delete succession plan" className="text-text-secondary hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
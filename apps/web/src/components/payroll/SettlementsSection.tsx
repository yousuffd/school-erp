'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, FileCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { FullFinalSettlement, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function SettlementsSection({ tenantId }: Props) {
  const [settlements, setSettlements] = useState<FullFinalSettlement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [dues, setDues] = useState('0');
  const [deductions, setDeductions] = useState('0');

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getSettlements(tenantId), api.getEmployees(tenantId)])
      .then(([s, e]) => {
        setSettlements(s);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load settlements'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createSettlement({
        tenant_id: tenantId,
        employee_id: employeeId,
        last_working_date: lastWorkingDate,
        dues,
        deductions,
      });
      setEmployeeId('');
      setLastWorkingDate('');
      setDues('0');
      setDeductions('0');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create settlement');
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess(id: string) {
    setProcessingId(id);
    setError(null);
    try {
      await api.processSettlement(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to process settlement');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <Card
      title="Full & Final Settlements"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Settlement
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Employee</label>
            <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Last Working Date</label>
            <input required type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Dues</label>
            <input type="number" value={dues} onChange={(e) => setDues(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Deductions</label>
            <input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="sm:col-span-4 rounded-button bg-canvas p-3 text-caption text-text-secondary">
            Processing a settlement will mark this employee&apos;s HR record as <strong>terminated</strong>.
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Settlement'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : settlements.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No settlements yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Employee</th>
              <th className="py-2 pr-4 font-medium">Last Working Date</th>
              <th className="py-2 pr-4 font-medium">Dues</th>
              <th className="py-2 pr-4 font-medium">Deductions</th>
              <th className="py-2 pr-4 font-medium">Net Settlement</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 size={14} className="text-text-secondary" />
                    {employeeLabel(s.employee_id)}
                  </div>
                </td>
                <td className="py-3 pr-4 text-body text-text-secondary">{s.last_working_date}</td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.dues}</td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.deductions}</td>
                <td className="py-3 pr-4 font-mono text-body font-medium text-text-primary">{s.net_settlement_amount}</td>
                <td className="py-3 pr-4">
                  {s.status === 'pending' ? <Badge tone="warning">Pending</Badge> : <Badge tone="success">Processed</Badge>}
                </td>
                <td className="py-3 pr-4 text-right">
                  {s.status === 'pending' && (
                    <Button variant="secondary" onClick={() => handleProcess(s.id)} disabled={processingId === s.id}>
                      {processingId === s.id ? 'Processing…' : 'Process'}
                    </Button>
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
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Landmark, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { LoanAdvance, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function LoansSection({ tenantId }: Props) {
  const [loans, setLoans] = useState<LoanAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [monthlyRecoveryAmount, setMonthlyRecoveryAmount] = useState('');

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getLoanAdvances(tenantId), api.getEmployees(tenantId)])
      .then(([l, e]) => {
        setLoans(l);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load loans/advances'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createLoanAdvance({
        tenant_id: tenantId,
        employee_id: employeeId,
        amount,
        monthly_recovery_amount: monthlyRecoveryAmount,
      });
      setEmployeeId('');
      setAmount('');
      setMonthlyRecoveryAmount('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create loan/advance');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id: string) {
    setClosingId(id);
    setError(null);
    try {
      await api.closeLoanAdvance(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close loan/advance');
    } finally {
      setClosingId(null);
    }
  }

  return (
    <Card
      title="Loans & Advances"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Loan/Advance
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
            <label className="mb-1 block text-caption text-text-secondary">Total Amount</label>
            <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Monthly Recovery</label>
            <input required type="number" value={monthlyRecoveryAmount} onChange={(e) => setMonthlyRecoveryAmount(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Create'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No loans or advances yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Employee</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Monthly Recovery</th>
              <th className="py-2 pr-4 font-medium">Remaining</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">
                  <div className="flex items-center gap-1.5">
                    <Landmark size={14} className="text-text-secondary" />
                    {employeeLabel(l.employee_id)}
                  </div>
                </td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">{l.amount}</td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">{l.monthly_recovery_amount}</td>
                <td className="py-3 pr-4 font-mono text-body text-text-secondary">{l.remaining_balance}</td>
                <td className="py-3 pr-4">
                  {l.status === 'active' ? <Badge tone="warning">Active</Badge> : <Badge tone="success">Closed</Badge>}
                </td>
                <td className="py-3 pr-4 text-right">
                  {l.status === 'active' && (
                    <button
                      onClick={() => handleClose(l.id)}
                      disabled={closingId === l.id}
                      className="flex items-center gap-1 text-caption text-text-secondary hover:text-danger disabled:opacity-50"
                    >
                      <X size={14} /> Close
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
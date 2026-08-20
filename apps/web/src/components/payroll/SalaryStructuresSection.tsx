'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { SalaryStructure, Employee } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

export function SalaryStructuresSection({ tenantId }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('0');
  const [specialAllowance, setSpecialAllowance] = useState('0');
  const [otherAllowances, setOtherAllowances] = useState('0');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  useEffect(() => {
    setLoading(true);
    api
      .getEmployees(tenantId)
      .then(setEmployees)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load employees'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function loadStructures(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    setLoadingStructures(true);
    api
      .getSalaryStructuresForEmployee(employeeId)
      .then(setStructures)
      .catch(() => setStructures([]))
      .finally(() => setLoadingStructures(false));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createSalaryStructure({
        tenant_id: tenantId,
        employee_id: selectedEmployeeId,
        basic_salary: basicSalary,
        hra,
        special_allowance: specialAllowance,
        other_allowances: otherAllowances,
        effective_from: effectiveFrom,
        bank_account_number: bankAccountNumber || undefined,
        bank_ifsc_code: bankIfscCode || undefined,
        bank_account_holder_name: bankAccountHolderName || undefined,
      });
      setBasicSalary('');
      setHra('0');
      setSpecialAllowance('0');
      setOtherAllowances('0');
      setBankAccountNumber('');
      setBankIfscCode('');
      setBankAccountHolderName('');
      setShowForm(false);
      loadStructures(selectedEmployeeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create salary structure');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card title="Select Employee">
        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : (
          <select
            value={selectedEmployeeId}
            onChange={(e) => loadStructures(e.target.value)}
            className="w-full rounded-button border border-border px-3 py-2 text-body sm:w-96"
          >
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.designation}
              </option>
            ))}
          </select>
        )}
      </Card>

      {selectedEmployeeId && (
        <Card
          title={`Salary History — ${employeeLabel(selectedEmployeeId)}`}
          action={
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> New Structure
            </Button>
          }
        >
          {showForm && (
            <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Basic Salary</label>
                <input required type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">HRA</label>
                <input type="number" value={hra} onChange={(e) => setHra(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Special Allowance</label>
                <input type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Other Allowances</label>
                <input type="number" value={otherAllowances} onChange={(e) => setOtherAllowances(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Effective From</label>
                <input required type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Bank Account Number</label>
                <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body font-mono text-caption" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">IFSC Code</label>
                <input value={bankIfscCode} onChange={(e) => setBankIfscCode(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body font-mono text-caption" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Account Holder Name</label>
                <input value={bankAccountHolderName} onChange={(e) => setBankAccountHolderName(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div className="sm:col-span-4">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Structure'}</Button>
              </div>
            </form>
          )}

          {loadingStructures ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : structures.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No salary structure recorded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Effective From</th>
                  <th className="py-2 pr-4 font-medium">Basic</th>
                  <th className="py-2 pr-4 font-medium">HRA</th>
                  <th className="py-2 pr-4 font-medium">Special Allowance</th>
                  <th className="py-2 pr-4 font-medium">Bank Details</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium text-text-primary">{s.effective_from}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.basic_salary}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.hra}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.special_allowance}</td>
                    <td className="py-3 pr-4">
                      {s.bank_account_number ? (
                        <div className="flex items-center gap-1.5 text-caption text-text-secondary">
                          <Landmark size={12} /> {s.bank_account_number} · {s.bank_ifsc_code}
                        </div>
                      ) : (
                        <span className="text-caption text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
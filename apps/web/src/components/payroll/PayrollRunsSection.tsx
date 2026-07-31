'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Play, Banknote, Download, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { PayrollRun, Payslip, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<PayrollRun['status'], 'warning' | 'info' | 'success'> = {
  draft: 'warning',
  processed: 'info',
  disbursed: 'success',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PayrollRunsSection({ tenantId }: Props) {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [downloadingBankFile, setDownloadingBankFile] = useState(false);
  const [skippedInfo, setSkippedInfo] = useState<string[] | null>(null);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getPayrollRuns(tenantId), api.getEmployees(tenantId)])
      .then(([r, e]) => {
        setRuns(r);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load payroll runs'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function loadPayslips(runId: string) {
    setSelectedRunId(runId);
    setSkippedInfo(null);
    setLoadingPayslips(true);
    api
      .getPayslipsForRun(runId)
      .then(setPayslips)
      .catch(() => setPayslips([]))
      .finally(() => setLoadingPayslips(false));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createPayrollRun({ tenant_id: tenantId, month, year });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create payroll run');
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess(runId: string) {
    setProcessing(true);
    setError(null);
    setSkippedInfo(null);
    try {
      const result = await api.processPayrollRun(runId);
      setPayslips(result.payslips);
      if (result.skippedEmployeeIds.length > 0) {
        setSkippedInfo(result.skippedEmployeeIds.map((id) => employeeLabel(id)));
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to process payroll run');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDisburse(runId: string) {
    setDisbursing(true);
    setError(null);
    try {
      await api.markPayrollRunDisbursed(runId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark run as disbursed');
    } finally {
      setDisbursing(false);
    }
  }

  async function handleDownloadBankFile(runId: string) {
    setDownloadingBankFile(true);
    setError(null);
    try {
      await api.downloadPayrollBankFile(runId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download bank file');
    } finally {
      setDownloadingBankFile(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Payroll Runs"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Run
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full rounded-button border border-border px-3 py-2 text-body">
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Year</label>
              <input required type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Run'}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No payroll runs yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => loadPayslips(r.id)}
                className={`rounded-card border p-4 text-left transition-colors ${selectedRunId === r.id ? 'border-accent bg-accent-light' : 'border-border hover:bg-canvas'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Banknote size={18} className="text-accent" />
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
                <div className="font-medium text-text-primary">{MONTH_NAMES[r.month - 1]} {r.year}</div>
                {r.processed_date && <div className="text-caption text-text-secondary">Processed {r.processed_date}</div>}
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedRun && (
        <Card
          title={`Payslips — ${MONTH_NAMES[selectedRun.month - 1]} ${selectedRun.year}`}
          action={
            <div className="flex items-center gap-2">
              {selectedRun.status === 'draft' && (
                <Button onClick={() => handleProcess(selectedRun.id)} disabled={processing} className="flex items-center gap-1.5">
                  <Play size={14} /> {processing ? 'Processing…' : 'Process Run'}
                </Button>
              )}
              {selectedRun.status === 'processed' && (
                <>
                  <Button variant="secondary" onClick={() => handleDownloadBankFile(selectedRun.id)} disabled={downloadingBankFile} className="flex items-center gap-1.5">
                    <Download size={14} /> {downloadingBankFile ? 'Downloading…' : 'Bank File'}
                  </Button>
                  <Button onClick={() => handleDisburse(selectedRun.id)} disabled={disbursing} className="flex items-center gap-1.5">
                    <Landmark size={14} /> {disbursing ? 'Marking…' : 'Mark Disbursed'}
                  </Button>
                </>
              )}
              {selectedRun.status === 'disbursed' && (
                <Button variant="secondary" onClick={() => handleDownloadBankFile(selectedRun.id)} disabled={downloadingBankFile} className="flex items-center gap-1.5">
                  <Download size={14} /> {downloadingBankFile ? 'Downloading…' : 'Bank File'}
                </Button>
              )}
            </div>
          }
        >
          {skippedInfo && skippedInfo.length > 0 && (
            <div className="mb-4 rounded-card border border-warning/30 bg-warning/10 p-4 text-body text-text-primary">
              {skippedInfo.length} employee{skippedInfo.length === 1 ? '' : 's'} skipped — no salary structure on file: {skippedInfo.join(', ')}
            </div>
          )}

          {loadingPayslips ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : payslips.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">
              {selectedRun.status === 'draft' ? 'Not processed yet — click "Process Run" above.' : 'No payslips found.'}
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Gross</th>
                  <th className="py-2 pr-4 font-medium">PF</th>
                  <th className="py-2 pr-4 font-medium">ESI</th>
                  <th className="py-2 pr-4 font-medium">PT</th>
                  <th className="py-2 pr-4 font-medium">Loan</th>
                  <th className="py-2 pr-4 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium text-text-primary">{employeeLabel(p.employee_id)}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.gross_salary}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.pf_employee}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.esi_employee}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.professional_tax}</td>
                    <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.loan_deduction}</td>
                    <td className="py-3 pr-4 font-mono text-body font-medium text-text-primary">{p.net_salary}</td>
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
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { LeaveRequest, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<LeaveRequest['status'], 'success' | 'danger' | 'warning'> = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
};

export function LeaveRequestsSection({ tenantId }: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leave_type']>('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getLeaveRequests(tenantId), api.getEmployees(tenantId)])
      .then(([r, e]) => {
        setRequests(r);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load leave requests'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createLeaveRequest({
        tenant_id: tenantId,
        employee_id: employeeId,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: reason || undefined,
      });
      setEmployeeId('');
      setFromDate('');
      setToDate('');
      setReason('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create leave request');
    } finally {
      setSaving(false);
    }
  }

  async function handleDecide(id: string, decision: 'approve' | 'reject') {
    setDecidingId(id);
    setError(null);
    try {
      if (decision === 'approve') await api.approveLeaveRequest(id);
      else await api.rejectLeaveRequest(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update leave request');
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <Card
      title="Leave Requests"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Request
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-5">
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
            <label className="mb-1 block text-caption text-text-secondary">Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leave_type'])} className="w-full rounded-button border border-border px-3 py-2 text-body">
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">From</label>
            <input required type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">To</label>
            <input required type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="sm:col-span-5">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Submit Request'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No leave requests yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Employee</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Dates</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">{employeeLabel(r.employee_id)}</td>
                <td className="py-3 pr-4 text-body capitalize text-text-secondary">{r.leave_type}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{r.from_date} → {r.to_date}</td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </td>
                <td className="py-3 pr-4 text-right">
                  {r.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, 'approve')}
                        aria-label="Approve"
                        className="flex items-center gap-1 text-caption text-success hover:opacity-80 disabled:opacity-40"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, 'reject')}
                        aria-label="Reject"
                        className="flex items-center gap-1 text-caption text-danger hover:opacity-80 disabled:opacity-40"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
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
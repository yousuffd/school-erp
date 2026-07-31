'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Users, Network } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<Employee['status'], 'success' | 'warning' | 'danger'> = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'danger',
};

function OrgChartNode({ employee, all, depth }: { employee: Employee; all: Employee[]; depth: number }) {
  const reports = all.filter((e) => e.manager_id === employee.id);
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="mb-1 flex items-center gap-2 rounded-button border border-border bg-card px-3 py-2">
        <Users size={14} className="text-text-secondary" />
        <span className="font-medium text-text-primary">{employee.name}</span>
        <span className="text-caption text-text-secondary">— {employee.designation}</span>
      </div>
      {reports.map((r) => (
        <OrgChartNode key={r.id} employee={r} all={all} depth={depth + 1} />
      ))}
    </div>
  );
}

export function EmployeesSection({ tenantId }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<'list' | 'org-chart'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [managerId, setManagerId] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().slice(0, 10));

  function managerLabel(id: string | null) {
    if (!id) return '—';
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    api
      .getEmployees(tenantId)
      .then(setEmployees)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load employees'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createEmployee({
        tenant_id: tenantId,
        name,
        email,
        department,
        designation,
        manager_id: managerId || undefined,
        date_of_joining: dateOfJoining,
      });
      setName('');
      setEmail('');
      setDepartment('');
      setDesignation('');
      setManagerId('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  }

  const roots = employees.filter((e) => !e.manager_id || !employees.some((m) => m.id === e.manager_id));

  return (
    <Card
      title="Employees"
      action={
        <div className="flex items-center gap-2">
          <div className="flex rounded-button border border-border">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-caption ${view === 'list' ? 'bg-accent text-white' : 'text-text-secondary'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('org-chart')}
              className={`flex items-center gap-1 px-3 py-1.5 text-caption ${view === 'org-chart' ? 'bg-accent text-white' : 'text-text-secondary'}`}
            >
              <Network size={12} /> Org Chart
            </button>
          </div>
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Employee
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Department</label>
            <input required value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Designation</label>
            <input required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Manager</label>
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
              <option value="">None</option>
              {employees.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Date of Joining</label>
            <input required type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Employee'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : employees.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No employees yet.</p>
      ) : view === 'list' ? (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Department</th>
              <th className="py-2 pr-4 font-medium">Designation</th>
              <th className="py-2 pr-4 font-medium">Manager</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">{emp.name}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{emp.department}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{emp.designation}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{managerLabel(emp.manager_id)}</td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[emp.status]}>{emp.status.replace('_', ' ')}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="space-y-2">
          {roots.map((r) => (
            <OrgChartNode key={r.id} employee={r} all={employees} depth={0} />
          ))}
        </div>
      )}
    </Card>
  );
}
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { StaffCertification, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function CertificationsSection({ tenantId }: Props) {
  const [certifications, setCertifications] = useState<StaffCertification[]>([]);
  const [expiringSoonIds, setExpiringSoonIds] = useState<Set<string>>(new Set());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [certificationName, setCertificationName] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getCertifications(tenantId), api.getCertificationsExpiringSoon(tenantId), api.getEmployees(tenantId)])
      .then(([all, soon, emps]) => {
        setCertifications(all);
        setExpiringSoonIds(new Set(soon.map((c) => c.id)));
        setEmployees(emps);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load certifications'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createCertification({
        tenant_id: tenantId,
        employee_id: employeeId,
        certification_name: certificationName,
        issued_date: issuedDate,
        expiry_date: expiryDate || undefined,
      });
      setEmployeeId('');
      setCertificationName('');
      setIssuedDate('');
      setExpiryDate('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add certification');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteCertification(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete certification');
    }
  }

  return (
    <Card
      title="Staff Certifications"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Certification
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {expiringSoonIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-body text-text-primary">
          <AlertTriangle size={16} className="text-warning" />
          {expiringSoonIds.size} certification{expiringSoonIds.size === 1 ? '' : 's'} expiring within 30 days — highlighted below.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Employee</label>
            <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
              <option value="">Select an employee</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Certification Name</label>
            <input required value={certificationName} onChange={(e) => setCertificationName(e.target.value)} placeholder="First Aid" className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Issued Date</label>
            <input required type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Certification'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : certifications.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No certifications recorded yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Employee</th>
              <th className="py-2 pr-4 font-medium">Certification</th>
              <th className="py-2 pr-4 font-medium">Issued</th>
              <th className="py-2 pr-4 font-medium">Expires</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {certifications.map((c) => (
              <tr key={c.id} className={`border-b border-border last:border-0 ${expiringSoonIds.has(c.id) ? 'bg-warning/5' : ''}`}>
                <td className="py-3 pr-4 font-medium text-text-primary">{employeeLabel(c.employee_id)}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{c.certification_name}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{c.issued_date}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 text-body text-text-secondary">
                    {c.expiry_date ?? '—'}
                    {expiringSoonIds.has(c.id) && <Badge tone="warning">Expiring soon</Badge>}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right">
                  <button onClick={() => handleDelete(c.id)} aria-label="Delete certification" className="text-text-secondary hover:text-danger">
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
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Driver, DriverStatus } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function DriversSection({ tenantId }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');

  function load() {
    setLoading(true);
    api
      .getDrivers(tenantId)
      .then(setDrivers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setLicenseNumber('');
    setPhone('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDriver({ tenant_id: tenantId, name, license_number: licenseNumber, phone });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create driver');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: DriverStatus) {
    setError(null);
    try {
      await api.updateDriver(id, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteDriver(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete driver');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Drivers"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Driver
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">License Number</label>
              <input
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Phone</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Driver'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : drivers.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No drivers yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">License</th>
                  <th className="py-2 px-3 font-medium">Phone</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{d.name}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{d.license_number}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{d.phone}</td>
                    <td className="py-2 px-3">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value as DriverStatus)}
                        className="rounded-button border border-border px-2 py-1 text-caption"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Delete driver"
                      >
                        <Trash2 size={14} />
                      </button>
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

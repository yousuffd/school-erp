'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Vehicle, VehicleStatus } from '@/lib/types';

interface Props {
  tenantId: string;
  campusId: string;
}

export function VehiclesSection({ tenantId, campusId }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('40');

  function load() {
    setLoading(true);
    api
      .getVehicles(tenantId)
      .then(setVehicles)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setRegistrationNumber('');
    setModel('');
    setCapacity('40');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createVehicle({
        tenant_id: tenantId,
        campus_id: campusId,
        registration_number: registrationNumber,
        model: model || undefined,
        capacity: Number(capacity),
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: VehicleStatus) {
    setError(null);
    try {
      await api.updateVehicle(id, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteVehicle(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete vehicle');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Vehicles"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Vehicle
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Registration Number</label>
              <input
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="KA-01-AB-1234"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Tata Starbus"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Capacity</label>
              <input
                required
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Vehicle'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : vehicles.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No vehicles yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Registration</th>
                  <th className="py-2 px-3 font-medium">Model</th>
                  <th className="py-2 px-3 font-medium">Capacity</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{v.registration_number}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{v.model ?? '—'}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{v.capacity}</td>
                    <td className="py-2 px-3">
                      <select
                        value={v.status}
                        onChange={(e) => handleStatusChange(v.id, e.target.value as VehicleStatus)}
                        className="rounded-button border border-border px-2 py-1 text-caption"
                      >
                        <option value="active">Active</option>
                        <option value="under_maintenance">Under Maintenance</option>
                        <option value="retired">Retired</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Delete vehicle"
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

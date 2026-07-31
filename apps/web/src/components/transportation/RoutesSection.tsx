'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Route, RouteStop } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function RoutesSection({ tenantId }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopName, setStopName] = useState('');
  const [stopOrder, setStopOrder] = useState('1');
  const [savingStop, setSavingStop] = useState(false);

  function load() {
    setLoading(true);
    api
      .getRoutes(tenantId)
      .then(setRoutes)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setDescription('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createRoute({ tenant_id: tenantId, name, description: description || undefined });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create route');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteRoute(id);
      if (selectedRouteId === id) setSelectedRouteId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete route');
    }
  }

  async function handleSelectRoute(route: Route) {
    setSelectedRouteId(route.id);
    setShowStopForm(false);
    try {
      const s = await api.getRouteStops(route.id);
      setStops(s);
      setStopOrder(String(s.length + 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load stops');
    }
  }

  function resetStopForm() {
    setShowStopForm(false);
    setStopName('');
    setStopOrder(String(stops.length + 1));
  }

  async function handleAddStop(e: FormEvent) {
    e.preventDefault();
    setSavingStop(true);
    setError(null);
    try {
      await api.addRouteStop(selectedRouteId, {
        tenant_id: tenantId,
        route_id: selectedRouteId,
        name: stopName,
        sequence_order: Number(stopOrder),
      });
      const s = await api.getRouteStops(selectedRouteId);
      setStops(s);
      resetStopForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add stop');
    } finally {
      setSavingStop(false);
    }
  }

  async function handleDeleteStop(id: string) {
    setError(null);
    try {
      await api.deleteRouteStop(id);
      const s = await api.getRouteStops(selectedRouteId);
      setStops(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete stop');
    }
  }

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Routes"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Route
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Route Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="North Loop"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Route'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : routes.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No routes yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleSelectRoute(r)}
                    className={
                      selectedRouteId === r.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{r.name}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{r.description ?? '—'}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="text-text-secondary hover:text-danger"
                        title="Delete route"
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

      {selectedRoute && (
        <Card
          title={`Stops — ${selectedRoute.name}`}
          action={
            <Button
              variant="secondary"
              onClick={() => setShowStopForm((s) => !s)}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Stop
            </Button>
          }
        >
          {showStopForm && (
            <form
              onSubmit={handleAddStop}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Stop Name</label>
                <input
                  required
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Sequence Order</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={stopOrder}
                  onChange={(e) => setStopOrder(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={savingStop}>
                  {savingStop ? 'Saving…' : 'Add Stop'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetStopForm} disabled={savingStop}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {stops.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No stops yet.</p>
          ) : (
            <div className="space-y-2">
              {stops.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-card border border-border p-3">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-accent" />
                    <span className="font-mono text-caption text-text-secondary">#{s.sequence_order}</span>
                    <span className="text-body text-text-primary">{s.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteStop(s.id)}
                    className="text-text-secondary hover:text-danger"
                    title="Delete stop"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

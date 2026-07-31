'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { Campus, Item, ProcurementRequest, ProcurementRequestStatus } from '@/lib/types';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<ProcurementRequestStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  fulfilled: 'success',
};

export function ProcurementSection({ tenantId }: Props) {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [notes, setNotes] = useState('');

  const [actingId, setActingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([api.getProcurementRequests(tenantId), api.getItems(tenantId), api.getCampuses(tenantId)])
      .then(([r, i, c]) => {
        setRequests(r);
        setItems(i);
        setCampuses(c);
        setCampusId((prev) => prev || c[0]?.id || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setItemId('');
    setQuantityRequested('');
    setRequestedDate('');
    setNotes('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createProcurementRequest({
        tenant_id: tenantId,
        item_id: itemId,
        campus_id: campusId,
        quantity_requested: Number(quantityRequested),
        requested_date: requestedDate,
        notes: notes || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create request');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: ProcurementRequestStatus) {
    setActingId(id);
    setError(null);
    try {
      await api.updateProcurementRequestStatus(id, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update request');
    } finally {
      setActingId(null);
    }
  }

  function itemName(id: string) {
    return items.find((i) => i.id === id)?.name ?? '—';
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Procurement Requests"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Request
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Item</label>
              <select
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Campus</label>
              <select
                required
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Quantity</label>
              <input
                required
                type="number"
                min={1}
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Requested Date</label>
              <input
                required
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Submit Request'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No procurement requests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Item</th>
                  <th className="py-2 px-3 font-medium">Quantity</th>
                  <th className="py-2 px-3 font-medium">Requested</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{itemName(r.item_id)}</td>
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{r.quantity_requested}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{r.requested_date}</td>
                    <td className="py-2 px-3">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(r.id, 'approved')}
                            disabled={actingId === r.id}
                            className="flex items-center gap-1 text-caption font-medium text-success hover:underline"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, 'rejected')}
                            disabled={actingId === r.id}
                            className="flex items-center gap-1 text-caption font-medium text-danger hover:underline"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'fulfilled')}
                          disabled={actingId === r.id}
                          className="flex items-center gap-1 text-caption font-medium text-accent hover:underline"
                        >
                          <Check size={12} /> Mark Fulfilled
                        </button>
                      )}
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

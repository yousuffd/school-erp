'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { Campus, Item, StockLevel, StockTransaction, StockTransactionType } from '@/lib/types';

interface Props {
  tenantId: string;
}

const TX_TYPES: StockTransactionType[] = ['received', 'issued', 'adjusted'];
const TX_LABEL: Record<StockTransactionType, string> = {
  received: 'Received (+)',
  issued: 'Issued (-)',
  adjusted: 'Stock Correction (set exact count)',
};

export function StockSection({ tenantId }: Props) {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState('');
  const [txType, setTxType] = useState<StockTransactionType>('received');
  const [quantity, setQuantity] = useState('');
  const [txDate, setTxDate] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedItemId, setSelectedItemId] = useState('');
  const [history, setHistory] = useState<StockTransaction[]>([]);

  const bulkItems = items.filter((i) => !i.is_trackable_asset);

  // Campuses + items load once; stock reloads whenever the viewing campus changes.
  useEffect(() => {
    Promise.all([api.getItems(tenantId), api.getCampuses(tenantId)])
      .then(([i, c]) => {
        setItems(i);
        setCampuses(c);
        setCampusId((prev) => prev || c[0]?.id || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, [tenantId]);

  function loadStock() {
    if (!campusId) return;
    setLoading(true);
    api
      .getStock(tenantId, campusId)
      .then(setStock)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load stock'))
      .finally(() => setLoading(false));
  }

  useEffect(loadStock, [tenantId, campusId]);

  function resetForm() {
    setShowForm(false);
    setItemId('');
    setTxType('received');
    setQuantity('');
    setTxDate('');
    setNotes('');
  }

  async function handleRecord(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.recordStockTransaction({
        tenant_id: tenantId,
        item_id: itemId,
        campus_id: campusId,
        transaction_type: txType,
        quantity: Number(quantity),
        transaction_date: txDate,
        notes: notes || undefined,
      });
      resetForm();
      loadStock();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectItem(id: string) {
    setSelectedItemId(id);
    try {
      const h = await api.getStockTransactionsForItem(id, campusId);
      setHistory(h);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load transaction history');
    }
  }

  function itemName(id: string) {
    return items.find((i) => i.id === id)?.name ?? '—';
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const currentCampusName = campuses.find((c) => c.id === campusId)?.name ?? '';

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-caption text-text-secondary">Viewing campus:</label>
        <select
          value={campusId}
          onChange={(e) => setCampusId(e.target.value)}
          className="rounded-button border border-border px-3 py-1.5 text-body"
        >
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Card
        title="Record a Stock Transaction"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Record Transaction
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleRecord}
            className="grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
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
                {bulkItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
              {bulkItems.length === 0 && (
                <p className="mt-1 text-caption text-text-secondary">
                  No bulk-tracked items yet — add one under Item Catalog first.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Recording for</label>
              <p className="rounded-button border border-border bg-card px-3 py-2 text-body font-medium text-text-primary">
                {currentCampusName}
              </p>
              <p className="mt-1 text-caption text-text-secondary">
                Change &quot;Viewing campus&quot; above to record for a different campus.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Type</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as StockTransactionType)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {TX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TX_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">
                {txType === 'adjusted' ? 'New Total Count' : 'Quantity'}
              </label>
              <input
                required
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input
                required
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Record Transaction'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Current Stock Levels">
        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : stock.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">
            No bulk-tracked items yet — add one under Item Catalog first.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Item</th>
                  <th className="py-2 px-3 font-medium">On Hand</th>
                  <th className="py-2 px-3 font-medium">Reorder Point</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleSelectItem(s.item_id)}
                    className={
                      selectedItemId === s.item_id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{s.item_name}</td>
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{s.quantity_on_hand}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">
                      {s.reorder_point ?? '—'}
                    </td>
                    <td className="py-2 px-3">
                      {s.below_reorder_point ? (
                        <Badge tone="danger">
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} /> Reorder needed
                          </span>
                        </Badge>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedItem && (
        <Card title={`Transaction History — ${itemName(selectedItemId)}`}>
          {history.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No transactions yet at this campus.</p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium">Quantity</th>
                    <th className="py-2 px-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 font-mono text-caption text-text-secondary">{h.transaction_date}</td>
                      <td className="py-2 px-3">
                        <Badge
                          tone={h.transaction_type === 'received' ? 'success' : h.transaction_type === 'issued' ? 'warning' : 'info'}
                        >
                          {TX_LABEL[h.transaction_type]}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-body text-text-primary">{h.quantity}</td>
                      <td className="py-2 px-3 text-body text-text-secondary">{h.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

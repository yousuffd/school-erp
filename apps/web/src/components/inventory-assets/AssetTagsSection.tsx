'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { AssetTag, AssetTagStatus, Campus, Item } from '@/lib/types';

interface Props {
  tenantId: string;
}

const STATUSES: AssetTagStatus[] = ['in_use', 'under_repair', 'retired', 'lost'];

export function AssetTagsSection({ tenantId }: Props) {
  const [tags, setTags] = useState<AssetTag[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [assignedLocation, setAssignedLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');

  const trackableItems = items.filter((i) => i.is_trackable_asset);

  function load() {
    setLoading(true);
    Promise.all([api.getAssetTags(tenantId), api.getItems(tenantId), api.getCampuses(tenantId)])
      .then(([t, i, c]) => {
        setTags(t);
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
    setTagNumber('');
    setAssignedLocation('');
    setPurchaseDate('');
    setPurchaseCost('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createAssetTag({
        tenant_id: tenantId,
        item_id: itemId,
        campus_id: campusId,
        asset_tag_number: tagNumber,
        assigned_location: assignedLocation || undefined,
        purchase_date: purchaseDate || undefined,
        purchase_cost: purchaseCost || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create asset tag');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: AssetTagStatus) {
    setError(null);
    try {
      await api.updateAssetTag(id, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
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
        title="Asset Tags"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Asset Tag
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
                {trackableItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              {trackableItems.length === 0 && (
                <p className="mt-1 text-caption text-text-secondary">
                  No individually-tracked items yet — add one under Item Catalog first.
                </p>
              )}
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
              <label className="mb-1 block text-caption text-text-secondary">Asset Tag Number</label>
              <input
                required
                value={tagNumber}
                onChange={(e) => setTagNumber(e.target.value)}
                placeholder="INV-0042"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Assigned Location</label>
              <input
                value={assignedLocation}
                onChange={(e) => setAssignedLocation(e.target.value)}
                placeholder="Lab 2"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Purchase Cost</label>
              <input
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="e.g. 12500.00"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Asset Tag'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : tags.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No asset tags yet.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-card border border-border p-3">
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-accent" />
                  <span className="font-mono text-body text-text-primary">{t.asset_tag_number}</span>
                  <span className="text-body text-text-secondary">{itemName(t.item_id)}</span>
                  {t.assigned_location && (
                    <span className="text-caption text-text-secondary">— {t.assigned_location}</span>
                  )}
                </div>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value as AssetTagStatus)}
                  className="rounded-button border border-border px-2 py-1 text-caption"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { Item, ItemCategory } from '@/lib/types';

interface Props {
  tenantId: string;
}

const CATEGORIES: ItemCategory[] = ['stationery', 'uniform', 'lab_equipment', 'furniture', 'other'];
const CATEGORY_LABEL: Record<ItemCategory, string> = {
  stationery: 'Stationery',
  uniform: 'Uniform',
  lab_equipment: 'Lab Equipment',
  furniture: 'Furniture',
  other: 'Other',
};

export function ItemsSection({ tenantId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<ItemCategory | ''>('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('stationery');
  const [unit, setUnit] = useState('pcs');
  const [isTrackableAsset, setIsTrackableAsset] = useState(false);
  const [reorderPoint, setReorderPoint] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    setLoading(true);
    api
      .getItems(tenantId, filterCategory || undefined)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId, filterCategory]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setCategory('stationery');
    setUnit('pcs');
    setIsTrackableAsset(false);
    setReorderPoint('');
    setDescription('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createItem({
        tenant_id: tenantId,
        name,
        category,
        unit,
        is_trackable_asset: isTrackableAsset,
        reorder_point: !isTrackableAsset && reorderPoint ? Number(reorderPoint) : undefined,
        description: description || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteItem(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete item');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Item Catalog"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Item
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
              <label className="mb-1 block text-caption text-text-secondary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Unit of Measurement</label>
              <input
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. pcs, box, ream, set"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
              <p className="mt-1 text-caption text-text-secondary">
                How this item is counted — not a quantity. Actual stock counts are recorded separately, under Stock.
              </p>
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-caption text-text-secondary">How is this item tracked?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrackableAsset(false)}
                  className={
                    !isTrackableAsset
                      ? 'flex-1 rounded-button border-2 border-accent bg-accent-light px-4 py-3 text-left'
                      : 'flex-1 rounded-button border-2 border-border px-4 py-3 text-left hover:bg-canvas'
                  }
                >
                  <span className="block text-body font-medium text-text-primary">Bulk / Consumable</span>
                  <span className="block text-caption text-text-secondary">
                    Counted as a quantity (stationery, paper, supplies) — tracked under Stock
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTrackableAsset(true)}
                  className={
                    isTrackableAsset
                      ? 'flex-1 rounded-button border-2 border-accent bg-accent-light px-4 py-3 text-left'
                      : 'flex-1 rounded-button border-2 border-border px-4 py-3 text-left hover:bg-canvas'
                  }
                >
                  <span className="block text-body font-medium text-text-primary">Individually Tagged Asset</span>
                  <span className="block text-caption text-text-secondary">
                    Each physical unit gets its own tag number (furniture, lab equipment) — tracked under Asset Tags
                  </span>
                </button>
              </div>
              <p className="mt-2 text-caption text-warning">
                This choice can&apos;t be changed after saving — pick carefully.
              </p>
            </div>
            {!isTrackableAsset && (
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Reorder Point</label>
                <input
                  type="number"
                  min={0}
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  placeholder="Alert when stock falls to/below this"
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
            )}
            <div className="sm:col-span-3">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Item'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="mb-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ItemCategory | '')}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No items yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Unit</th>
                  <th className="py-2 px-3 font-medium">Tracking</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{i.name}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{CATEGORY_LABEL[i.category]}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{i.unit}</td>
                    <td className="py-2 px-3">
                      <Badge tone={i.is_trackable_asset ? 'info' : 'neutral'}>
                        {i.is_trackable_asset ? 'Asset Tags' : 'Bulk Stock'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDelete(i.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Delete item"
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

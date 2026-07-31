'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { MenuItem } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function MenuItemsSection({ tenantId }: Props) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dietaryTags, setDietaryTags] = useState('');

  function load() {
    setLoading(true);
    api
      .getMenuItems(tenantId)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setDescription('');
    setDietaryTags('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createMenuItem({
        tenant_id: tenantId,
        name,
        description: description || undefined,
        dietary_tags: dietaryTags || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create menu item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteMenuItem(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete menu item');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Menu Items"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Dish
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Dish Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Dietary Tags</label>
              <input
                value={dietaryTags}
                onChange={(e) => setDietaryTags(e.target.value)}
                placeholder="vegetarian, vegan, contains_nuts…"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Dish'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No menu items yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-card border border-border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-text-primary">{i.name}</span>
                    {i.dietary_tags
                      ?.split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <Badge key={tag} tone="success">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                  {i.description && <p className="mt-1 text-caption text-text-secondary">{i.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(i.id)}
                  className="text-text-secondary hover:text-danger"
                  title="Delete dish"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

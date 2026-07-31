'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { Activity, ActivityCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  club: 'Club',
  sport: 'Sport',
  cultural: 'Cultural',
};

function categoryTone(category: ActivityCategory): 'success' | 'warning' | 'neutral' {
  switch (category) {
    case 'sport':
      return 'success';
    case 'cultural':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function ActivitiesSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'activities', 'create');
  const canEdit = hasPermission(user, 'activities', 'edit');
  const canDelete = hasPermission(user, 'activities', 'delete');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('club');
  const [description, setDescription] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    api
      .getActivities(user.tenantId!)
      .then(setActivities)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setCategory('club');
    setDescription('');
  }

  function startEdit(activity: Activity) {
    setEditingId(activity.id);
    setName(activity.name);
    setCategory(activity.category);
    setDescription(activity.description ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.updateActivity(editingId, { name, category, description: description || undefined });
      } else {
        await api.createActivity({ tenant_id: user.tenantId!, name, category, description: description || undefined });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteActivity(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete activity');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Clubs, Teams & Activities"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> New Activity
            </Button>
          ) : undefined
        }
      >
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
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
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No activities yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{a.name}</td>
                    <td className="py-2 px-3">
                      <Badge tone={categoryTone(a.category)}>{CATEGORY_LABELS[a.category]}</Badge>
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{a.description || '—'}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button onClick={() => startEdit(a)} className="text-text-secondary hover:text-accent" title="Edit">
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(a.id)} className="text-text-secondary hover:text-danger" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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
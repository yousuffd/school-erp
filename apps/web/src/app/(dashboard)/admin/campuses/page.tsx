'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Campus } from '@/lib/types';

export default function CampusesPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);

  function load() {
    if (!user) return;
    setLoading(true);
    api
      .getCampuses(user.tenantId!)
      .then(setCampuses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCampus({ tenant_id: user.tenantId!, name, address, timezone });
      setName('');
      setAddress('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create campus');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card
          title="All Campuses"
          action={
            canManage && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Campus
              </Button>
            )
          }
        >
          {showForm && canManage && (
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
                  placeholder="North Campus"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Timezone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Campus'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : campuses.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No campuses yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campuses.map((c) => (
                <div key={c.id} className="rounded-card border border-border p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-button bg-accent-light">
                    <Building2 size={18} className="text-accent" />
                  </div>
                  <div className="font-medium text-text-primary">{c.name}</div>
                  <div className="text-caption text-text-secondary">{c.address ?? 'No address on file'}</div>
                  <div className="mt-2 text-caption font-mono text-text-secondary">{c.timezone}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
  );
}

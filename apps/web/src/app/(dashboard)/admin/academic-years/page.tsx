'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarRange, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { AcademicYear } from '@/lib/types';

export default function AcademicYearsPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    if (!user) return;
    setLoading(true);
    api
      .getAcademicYears(user.tenantId!)
      .then(setYears)
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
      await api.createAcademicYear({
        tenant_id: user.tenantId!,
        label,
        start_date: startDate,
        end_date: endDate,
      });
      setLabel('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create academic year');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(id: string) {
    try {
      await api.setCurrentAcademicYear(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update academic year');
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
          title="All Academic Years"
          action={
            canManage && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Academic Year
              </Button>
            )
          }
        >
          {showForm && canManage && (
            <form
              onSubmit={handleCreate}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Label</label>
                <input
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="2026-27"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Start Date</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">End Date</label>
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : years.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No academic years yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="pb-2 font-medium">Label</th>
                  <th className="pb-2 font-medium">Start</th>
                  <th className="pb-2 font-medium">End</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-medium text-text-primary">
                        <CalendarRange size={16} className="text-text-secondary" />
                        {y.label}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-body text-text-secondary">{y.start_date}</td>
                    <td className="py-3 font-mono text-body text-text-secondary">{y.end_date}</td>
                    <td className="py-3">
                      {y.is_current ? <Badge tone="success">Current</Badge> : <Badge>Inactive</Badge>}
                    </td>
                    <td className="py-3 text-right">
                      {!y.is_current && canManage && (
                        <Button variant="secondary" onClick={() => handleSetCurrent(y.id)}>
                          Set as Current
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
  );
}

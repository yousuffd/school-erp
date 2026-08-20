'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { HostelMaintenanceRequest, HostelRoom } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<HostelMaintenanceRequest['status'], 'warning' | 'info' | 'success'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
};

export function MaintenanceSection({ tenantId }: Props) {
  const user = auth.getUser();
  const [requests, setRequests] = useState<HostelMaintenanceRequest[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [description, setDescription] = useState('');

  function roomLabel(id: string) {
    const r = rooms.find((r) => r.id === id);
    return r ? `${r.building_name} — ${r.room_number}` : id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelMaintenanceRequests(tenantId), api.getHostelRooms(tenantId)])
      .then(([reqs, r]) => {
        setRequests(reqs);
        setRooms(r);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load maintenance requests'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createHostelMaintenanceRequest({
        tenant_id: tenantId,
        room_id: roomId,
        description,
        reported_by: user.id,
        reported_date: new Date().toISOString().slice(0, 10),
      });
      setRoomId('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create maintenance request');
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance(req: HostelMaintenanceRequest) {
    const next = req.status === 'open' ? 'in_progress' : 'resolved';
    try {
      await api.updateHostelMaintenanceStatus(
        req.id,
        next,
        next === 'resolved' ? new Date().toISOString().slice(0, 10) : undefined,
      );
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  return (
    <Card
      title="Maintenance Requests"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Request
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Room</label>
            <select
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select a room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.building_name} — {r.room_number}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-caption text-text-secondary">Description</label>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Leaking tap, broken window latch…"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No maintenance requests yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Room</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 pr-4 font-medium">Reported</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-text-primary">
                  <div className="flex items-center gap-2">
                    <Wrench size={14} className="text-text-secondary" />
                    {roomLabel(r.room_id)}
                  </div>
                </td>
                <td className="py-3 pr-4 text-body text-text-secondary">{r.description}</td>
                <td className="py-3 pr-4 text-body text-text-secondary">{r.reported_date}</td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
                </td>
                <td className="py-3 pr-4 text-right">
                  {r.status !== 'resolved' && (
                    <Button variant="secondary" onClick={() => handleAdvance(r)}>
                      {r.status === 'open' ? 'Start Work' : 'Mark Resolved'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
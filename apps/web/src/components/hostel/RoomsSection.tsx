'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BedDouble, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { HostelRoom, Campus } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function RoomsSection({ tenantId }: Props) {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [campusId, setCampusId] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [roomType, setRoomType] = useState<HostelRoom['room_type']>('double');

  function campusLabel(id: string) {
    return campuses.find((c) => c.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelRooms(tenantId), api.getCampuses(tenantId)])
      .then(([r, c]) => {
        setRooms(r);
        setCampuses(c);
        // Default the form's campus selector once campuses are known —
        // most schools in this dataset have exactly one campus, so this
        // saves a click without hiding the field for multi-campus tenants.
        if (c.length > 0) setCampusId((prev) => prev || c[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load rooms'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createHostelRoom({
        tenant_id: tenantId,
        campus_id: campusId,
        building_name: buildingName,
        room_number: roomNumber,
        floor: floor ? Number(floor) : undefined,
        capacity: Number(capacity),
        room_type: roomType,
      });
      setBuildingName('');
      setRoomNumber('');
      setFloor('');
      setCapacity('2');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create room');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteHostelRoom(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete room');
    }
  }

  return (
    <Card
      title="Rooms"
      action={
        <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Room
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
          className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-6"
        >
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Campus</label>
            <select
              required
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select a campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Building</label>
            <input
              required
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="North Block"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Room Number</label>
            <input
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="101"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Floor</label>
            <input
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Capacity</label>
            <input
              required
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Type</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as HostelRoom['room_type'])}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>
          <div className="sm:col-span-6">
            <Button type="submit" disabled={saving || !campusId}>
              {saving ? 'Saving…' : 'Save Room'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : rooms.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No rooms yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <div key={r.id} className="rounded-card border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-button bg-accent-light">
                  <BedDouble size={18} className="text-accent" />
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  aria-label={`Delete room ${r.building_name} ${r.room_number}`}
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="font-medium text-text-primary">
                {r.building_name} — {r.room_number}
              </div>
              <div className="text-caption text-text-secondary">
                {campusLabel(r.campus_id)} · {r.room_type} · Capacity {r.capacity}
                {r.floor != null ? ` · Floor ${r.floor}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
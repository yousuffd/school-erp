'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { AlumniEvent, AlumniEventRegistration, AlumniProfile, Student } from '@/lib/types';
import { alumniLabel } from './alumni-helpers';

export function EventsSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'alumni', 'create');
  const canEdit = hasPermission(user, 'alumni', 'edit');
  const canDelete = hasPermission(user, 'alumni', 'delete');

  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<AlumniEventRegistration[]>([]);
  const [regAlumniId, setRegAlumniId] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getAlumniEvents(user.tenantId!), api.getAlumniProfiles(user.tenantId!), api.getStudents(user.tenantId!)])
      .then(([e, p, s]) => {
        setEvents(e);
        setProfiles(p);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setEventDate('');
    setLocation('');
    setDescription('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createAlumniEvent({
        tenant_id: user.tenantId!,
        name,
        event_date: eventDate,
        location: location || undefined,
        description: description || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    setError(null);
    try {
      await api.deleteAlumniEvent(id);
      if (expandedId === id) setExpandedId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete event');
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    api
      .getAlumniEventRegistrations(id)
      .then(setRegistrations)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load registrations'));
  }

  async function handleRegister(eventId: string) {
    if (!user || !regAlumniId) return;
    setError(null);
    try {
      await api.registerForAlumniEvent(eventId, { tenant_id: user.tenantId!, alumni_id: regAlumniId });
      setRegAlumniId('');
      setRegistrations(await api.getAlumniEventRegistrations(eventId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to register alumnus');
    }
  }

  function profileFor(id: string) {
    return profiles.find((p) => p.id === id);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Reunions & Events"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> New Event
            </Button>
          ) : undefined
        }
      >
        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input required type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Event'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="rounded-card border border-border">
                <div className="flex items-center justify-between p-3">
                  <button onClick={() => toggleExpand(ev.id)} className="flex flex-1 items-center gap-2 text-left">
                    {expandedId === ev.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="text-body font-medium text-text-primary">{ev.name}</span>
                    <span className="text-caption text-text-secondary">{ev.event_date}</span>
                    {ev.location && <span className="text-caption text-text-secondary">· {ev.location}</span>}
                  </button>
                  {canDelete && (
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-text-secondary hover:text-danger" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {ev.description && <p className="px-3 pb-3 text-body text-text-secondary">{ev.description}</p>}

                {expandedId === ev.id && (
                  <div className="border-t border-border p-3">
                    <p className="mb-2 text-caption font-medium text-text-secondary">Registrations</p>
                    {canEdit && (
                      <div className="mb-3 flex items-end gap-2">
                        <select
                          value={regAlumniId}
                          onChange={(e) => setRegAlumniId(e.target.value)}
                          className="flex-1 rounded-button border border-border px-3 py-2 text-body"
                        >
                          <option value="">Select alumnus…</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>{alumniLabel(p, students)}</option>
                          ))}
                        </select>
                        <Button onClick={() => handleRegister(ev.id)} disabled={!regAlumniId}>Register</Button>
                      </div>
                    )}
                    {registrations.length === 0 ? (
                      <p className="text-body text-text-secondary">No registrations yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {registrations.map((r) => (
                          <li key={r.id} className="text-body text-text-primary">
                            {alumniLabel(profileFor(r.alumni_id), students)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
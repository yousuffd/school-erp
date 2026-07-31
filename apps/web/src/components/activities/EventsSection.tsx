'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, Trophy, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import {
  Activity,
  SchoolEvent,
  EventType,
  FixtureResult,
  EventRegistration,
  Student,
  SchoolClass,
} from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

const TYPE_LABELS: Record<EventType, string> = {
  competition: 'Competition',
  cultural: 'Cultural',
  fixture: 'Fixture',
};

function resultTone(result?: FixtureResult | null): 'success' | 'danger' | 'warning' | 'neutral' {
  switch (result) {
    case 'win':
      return 'success';
    case 'loss':
      return 'danger';
    case 'draw':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function EventsSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'activities', 'create');
  const canEdit = hasPermission(user, 'activities', 'edit');
  const canDelete = hasPermission(user, 'activities', 'delete');

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState<EventType>('competition');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [activityId, setActivityId] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [regStudentId, setRegStudentId] = useState('');

  const [resultFormId, setResultFormId] = useState<string | null>(null);
  const [ourScore, setOurScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [result, setResult] = useState<FixtureResult>('win');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getEvents(user.tenantId!),
      api.getActivities(user.tenantId!),
      api.getStudents(user.tenantId!),
      api.getClasses(user.tenantId!),
    ])
      .then(([e, a, s, c]) => {
        setEvents(e);
        setActivities(a);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setName('');
    setEventType('competition');
    setEventDate('');
    setLocation('');
    setOpponentName('');
    setActivityId('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createEvent({
        tenant_id: user.tenantId!,
        activity_id: activityId || undefined,
        name,
        event_type: eventType,
        event_date: eventDate,
        location: location || undefined,
        opponent_name: eventType === 'fixture' ? opponentName || undefined : undefined,
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
      await api.deleteEvent(id);
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
    setResultFormId(null);
    api
      .getEventRegistrations(id)
      .then(setRegistrations)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load registrations'));
  }

  async function handleRegister(eventId: string) {
    if (!user || !regStudentId) return;
    setError(null);
    try {
      await api.registerForEvent(eventId, { tenant_id: user.tenantId!, student_id: regStudentId });
      setRegStudentId('');
      setRegistrations(await api.getEventRegistrations(eventId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to register student');
    }
  }

  async function handleUnregister(id: string, eventId: string) {
    setError(null);
    try {
      await api.unregisterFromEvent(id);
      setRegistrations(await api.getEventRegistrations(eventId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to unregister student');
    }
  }

  function openResultForm(ev: SchoolEvent) {
    setResultFormId(ev.id);
    setOurScore(ev.our_score != null ? String(ev.our_score) : '');
    setOpponentScore(ev.opponent_score != null ? String(ev.opponent_score) : '');
    setResult(ev.result ?? 'win');
  }

  async function handleRecordResult(id: string) {
    setError(null);
    try {
      await api.recordFixtureResult(id, {
        our_score: Number(ourScore),
        opponent_score: Number(opponentScore),
        result,
      });
      setResultFormId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record result');
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function activityName(id?: string | null) {
    if (!id) return null;
    return activities.find((a) => a.id === id)?.name ?? null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Events & Fixtures"
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
              <label className="mb-1 block text-caption text-text-secondary">Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input required type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Linked Activity (optional)</label>
              <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                <option value="">None</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {eventType === 'fixture' && (
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Opponent</label>
                <input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
            )}
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
                    <Badge tone="neutral">{TYPE_LABELS[ev.event_type]}</Badge>
                    {ev.result && (
                      <Badge tone={resultTone(ev.result)}>
                        {ev.result.toUpperCase()} {ev.our_score}–{ev.opponent_score}
                      </Badge>
                    )}
                    <span className="text-caption text-text-secondary">{ev.event_date}</span>
                    {activityName(ev.activity_id) && (
                      <span className="text-caption text-text-secondary">· {activityName(ev.activity_id)}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {canEdit && ev.event_type === 'fixture' && (
                      <button onClick={() => openResultForm(ev)} className="text-text-secondary hover:text-accent" title="Record Result">
                        <Trophy size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDeleteEvent(ev.id)} className="text-text-secondary hover:text-danger" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {resultFormId === ev.id && (
                  <div className="grid grid-cols-1 gap-3 border-t border-border bg-canvas p-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-caption text-text-secondary">Our Score</label>
                      <input type="number" min={0} value={ourScore} onChange={(e) => setOurScore(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
                    </div>
                    <div>
                      <label className="mb-1 block text-caption text-text-secondary">Opponent Score</label>
                      <input type="number" min={0} value={opponentScore} onChange={(e) => setOpponentScore(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
                    </div>
                    <div>
                      <label className="mb-1 block text-caption text-text-secondary">Result</label>
                      <select value={result} onChange={(e) => setResult(e.target.value as FixtureResult)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                        <option value="draw">Draw</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={() => handleRecordResult(ev.id)}>Save</Button>
                      <Button variant="secondary" onClick={() => setResultFormId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {expandedId === ev.id && (
                  <div className="border-t border-border p-3">
                    <p className="mb-2 text-caption font-medium text-text-secondary">Registrations</p>
                    {canEdit && (
                      <div className="mb-3 flex items-end gap-2">
                        <div className="flex-1">
                          <StudentPicker students={students} classes={classes} value={regStudentId} onChange={setRegStudentId} />
                        </div>
                        <Button onClick={() => handleRegister(ev.id)} disabled={!regStudentId}>Register</Button>
                      </div>
                    )}
                    {registrations.length === 0 ? (
                      <p className="text-body text-text-secondary">No registrations yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {registrations.map((r) => (
                          <li key={r.id} className="flex items-center justify-between text-body">
                            <span className="text-text-primary">{studentName(r.student_id)}</span>
                            {canEdit && (
                              <button onClick={() => handleUnregister(r.id, ev.id)} className="text-text-secondary hover:text-danger" title="Unregister">
                                <Trash2 size={14} />
                              </button>
                            )}
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
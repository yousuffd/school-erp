'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Megaphone, Plus, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { AudienceScope, Circular, CircularReadReceipt, SchoolClass } from '@/lib/types';

export default function CommunicationPage() {
  const user = auth.getUser();
  const canCreate = isCoreAdminRole(user?.role);
  const isStudent = !!user?.studentId;
  const isParent = user?.role === 'Parent';
  const isSelfService = isStudent || isParent;
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myChildren, setMyChildren] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [audienceScope, setAudienceScope] = useState<AudienceScope>('whole_school');
  const [audienceGradeLevel, setAudienceGradeLevel] = useState('');
  const [audienceClassId, setAudienceClassId] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<CircularReadReceipt[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    setError(null);

    if (isParent) {
      // Resolve linked children first (same pattern as ParentDashboard/
      // ParentExaminationsView), then fetch that child's pre-filtered
      // circulars once one is selected.
      api
        .getMyLinkedStudents()
        .then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id))))
        .then((students) => {
          setMyChildren(students);
          const first = students[0]?.id ?? '';
          setSelectedChildId((prev) => prev || first);
          return first ? api.getMyCirculars(first) : Promise.resolve([]);
        })
        .then(setCirculars)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load circulars'))
        .finally(() => setLoading(false));
      return;
    }

    if (isStudent) {
      api
        .getMyCirculars()
        .then(setCirculars)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load circulars'))
        .finally(() => setLoading(false));
      return;
    }

    api
      .getCirculars(user.tenantId!)
      .then(setCirculars)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    if (canCreate) {
      api.getClasses(user.tenantId!).then(setClasses).catch(() => setClasses([]));
    }
  }

  useEffect(load, [user?.tenantId]);

  // Re-fetch when the Parent switches which child they're viewing.
  useEffect(() => {
    if (!isParent || !selectedChildId) return;
    setLoading(true);
    api
      .getMyCirculars(selectedChildId)
      .then(setCirculars)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load circulars'))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCircular({
        tenant_id: user.tenantId!,
        title,
        body,
        priority,
        audience_scope: audienceScope,
        audience_grade_level: audienceScope === 'grade' ? audienceGradeLevel : undefined,
        audience_school_class_id: audienceScope === 'class' ? audienceClassId : undefined,
      });
      setShowForm(false);
      setTitle('');
      setBody('');
      setPriority('normal');
      setAudienceScope('whole_school');
      setAudienceGradeLevel('');
      setAudienceClassId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish circular');
    } finally {
      setSaving(false);
    }
  }

  async function handleExpand(circular: Circular) {
    const next = expandedId === circular.id ? null : circular.id;
    setExpandedId(next);
    if (next) {
      if (isSelfService) {
        api.markMyCircularRead(circular.id, isParent ? selectedChildId : undefined).catch(() => {});
      } else {
        api.markCircularRead(circular.id).catch(() => {});
      }
      if (canCreate) {
        api.getCircularReadReceipts(circular.id).then(setReceipts).catch(() => setReceipts([]));
      }
    }
  }

  async function handleDelete(circularId: string) {
    if (!window.confirm('Delete this circular? This removes it and its read receipts permanently.')) return;
    setDeletingId(circularId);
    setError(null);
    try {
      await api.deleteCircular(circularId);
      if (expandedId === circularId) setExpandedId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete circular');
    } finally {
      setDeletingId(null);
    }
  }

  function audienceLabel(c: Circular): string {
    if (c.audience_scope === 'whole_school') return 'Whole School';
    if (c.audience_scope === 'staff') return 'Staff Only';
    if (c.audience_scope === 'grade') return c.audience_grade_level ?? 'Grade';
    const cls = classes.find((cl) => cl.id === c.audience_school_class_id);
    return cls ? `${cls.grade_level}${cls.section ? ` - ${cls.section}` : ''}` : 'Class';
  }

  return (
    <>
      <TopBar
        title="Communication"
        description="Circulars and announcements — in-app only for now, no SMS/email/push delivery yet."
      />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        {isParent && myChildren.length > 1 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            >
              {myChildren.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isParent && myChildren.length === 0 && !loading && (
          <Card title="Circulars">
            <p className="py-6 text-center text-body text-text-secondary">
              No children are linked to your account yet — contact the school office.
            </p>
          </Card>
        )}

        <Card
          title="Circulars"
          action={
            canCreate && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Circular
              </Button>
            )
          }
        >
          {showForm && canCreate && (
            <form onSubmit={handleCreate} className="mb-5 space-y-4 rounded-card border border-border bg-canvas p-4">
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Message</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Audience</label>
                  <select
                    value={audienceScope}
                    onChange={(e) => setAudienceScope(e.target.value as AudienceScope)}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="whole_school">Whole School</option>
                    <option value="grade">Specific Grade</option>
                    <option value="class">Specific Class</option>
                    <option value="staff">Staff Only</option>
                  </select>
                </div>
                {audienceScope === 'grade' && (
                  <div>
                    <label className="mb-1 block text-caption text-text-secondary">Grade Level</label>
                    <input
                      required
                      value={audienceGradeLevel}
                      onChange={(e) => setAudienceGradeLevel(e.target.value)}
                      placeholder="Grade 5"
                      className="w-full rounded-button border border-border px-3 py-2 text-body"
                    />
                  </div>
                )}
                {audienceScope === 'class' && (
                  <div>
                    <label className="mb-1 block text-caption text-text-secondary">Class</label>
                    <select
                      required
                      value={audienceClassId}
                      onChange={(e) => setAudienceClassId(e.target.value)}
                      className="w-full rounded-button border border-border px-3 py-2 text-body"
                    >
                      <option value="">Select…</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.grade_level}
                          {c.section ? ` - ${c.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish Circular'}
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : circulars.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No circulars yet.</p>
          ) : (
            <div className="space-y-3">
              {circulars.map((c) => (
                <div key={c.id} className="rounded-card border border-border p-4">
                  <div className="flex w-full items-start justify-between gap-3">
                    <button
                      onClick={() => handleExpand(c)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <div
                        className={
                          c.priority === 'urgent'
                            ? 'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-button bg-danger/10 text-danger'
                            : 'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-button bg-accent-light text-accent'
                        }
                      >
                        {c.priority === 'urgent' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{c.title}</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Badge tone="info">{audienceLabel(c)}</Badge>
                          {c.priority === 'urgent' && <Badge tone="danger">Urgent</Badge>}
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="whitespace-nowrap font-mono text-caption text-text-secondary">
                        {new Date(c.published_at).toLocaleDateString()}
                      </span>
                      {canCreate && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          aria-label="Delete circular"
                          className="text-text-secondary hover:text-danger disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="whitespace-pre-wrap text-body text-text-primary">{c.body}</p>
                      {canCreate && (
                        <p className="mt-3 text-caption text-text-secondary">
                          Read by {receipts.length} {receipts.length === 1 ? 'person' : 'people'} so far.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

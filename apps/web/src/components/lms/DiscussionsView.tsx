'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageSquare, Plus, Send, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isStudentRole } from '@/lib/roles';
import { AcademicYear, DiscussionPost, DiscussionThread, SchoolClass, Subject } from '@/lib/types';

export function DiscussionsView() {
  const user = auth.getUser();
  const isStudent = isStudentRole(user?.role);

  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');

  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  function load() {
    if (!user) return;
    setLoading(true);
    const listPromise = isStudent ? api.getMyDiscussionThreads() : api.getDiscussionThreads(user.tenantId!);
    Promise.all([
      listPromise,
      isStudent ? Promise.resolve([]) : api.getSubjects(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getClasses(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getAcademicYears(user.tenantId!),
    ])
      .then(([t, s, c, y]) => {
        setThreads(t);
        setSubjects(s);
        setClasses(c);
        setAcademicYears(y);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleCreateThread(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const currentYear = academicYears.find((y) => y.is_current) ?? academicYears[0];
      if (!currentYear) {
        setError('No academic year exists yet.');
        setSaving(false);
        return;
      }
      await api.createDiscussionThread({
        tenant_id: user.tenantId!,
        subject_id: subjectId,
        school_class_id: classId,
        academic_year_id: currentYear.id,
        title,
      });
      setShowForm(false);
      setTitle('');
      setSubjectId('');
      setClassId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create thread');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectThread(threadId: string) {
    setSelectedThreadId(threadId);
    try {
      const p = await api.getDiscussionPosts(threadId);
      setPosts(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load posts');
    }
  }

  async function handlePost() {
    if (!newPost.trim() || !selectedThreadId) return;
    setPosting(true);
    setError(null);
    try {
      await api.createDiscussionPost(selectedThreadId, newPost);
      setNewPost('');
      const p = await api.getDiscussionPosts(selectedThreadId);
      setPosts(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteThread(id: string) {
    if (!confirm('Delete this thread and all its replies?')) return;
    try {
      await api.deleteDiscussionThread(id);
      if (selectedThreadId === id) setSelectedThreadId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  function subjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? '—';
  }
  function className(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : '—';
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Discussion Threads"
        action={
          !isStudent ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> New Thread
            </Button>
          ) : undefined
        }
      >
        {showForm && (
          <form onSubmit={handleCreateThread} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Question about Chapter 4"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Class</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
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
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create Thread'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No discussion threads yet.</p>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <div
                key={t.id}
                className={
                  selectedThreadId === t.id
                    ? 'flex items-center justify-between rounded-card border border-accent bg-accent-light p-3'
                    : 'flex items-center justify-between rounded-card border border-border p-3 hover:bg-canvas'
                }
              >
                <button onClick={() => handleSelectThread(t.id)} className="flex flex-1 items-center gap-2 text-left">
                  <MessageSquare size={16} className="text-accent" />
                  <div>
                    <p className="text-body font-medium text-text-primary">{t.title}</p>
                    {!isStudent && (
                      <p className="text-caption text-text-secondary">
                        {subjectName(t.subject_id)} · {className(t.school_class_id)}
                      </p>
                    )}
                  </div>
                </button>
                {!isStudent && (
                  <button onClick={() => handleDeleteThread(t.id)} className="text-danger hover:opacity-70">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedThreadId && (
        <Card title="Replies">
          <div className="mb-4 space-y-3">
            {posts.length === 0 ? (
              <p className="text-body text-text-secondary">No replies yet — be the first to respond.</p>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="rounded-card border border-border p-3">
                  <p className="text-body text-text-primary">{p.content}</p>
                  <p className="mt-1 text-caption text-text-secondary">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 rounded-button border border-border px-3 py-2 text-body"
            />
            <Button onClick={handlePost} disabled={posting || !newPost.trim()} className="flex items-center gap-1.5">
              <Send size={14} /> {posting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

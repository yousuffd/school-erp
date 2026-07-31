'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, MessageCircle, Plus, Send, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StudentPicker } from '@/components/library/StudentPicker';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { DiaryEntry, DiaryEntryCategory, DiaryEntryScope, SchoolClass, Student } from '@/lib/types';

const CATEGORIES: DiaryEntryCategory[] = ['Homework', 'Remark', 'Notice', 'General'];

function categoryTone(c: DiaryEntryCategory): 'info' | 'warning' | 'success' {
  if (c === 'Homework') return 'warning';
  if (c === 'Notice') return 'info';
  return 'success';
}

/**
 * Single unified view for every role — the backend (DiaryService) already
 * scopes findAll/findOne/addReply correctly per user.roleName (Teacher: own
 * classes; Parent: linked children's class+student entries; Student: own
 * class+own entries; Admin/other permissioned staff: everything), so the
 * frontend doesn't need separate Parent/Teacher/Student view components the
 * way Discipline did — one GET /diary-entries call returns the right data
 * for whoever's logged in. Create is only offered to Teacher/Admin-type
 * roles (Parent/Student are read + reply only, matching the backend's own
 * addReply rejection of Student and the create-side lack of any
 * Parent/Student creation path). Reply box is hidden entirely for Student,
 * mirroring the server-side rejection in DiaryService.addReply.
 */
export function DiaryView() {
  const user = auth.getUser();
  const isStudent = !!user?.studentId;
  const isParent = user?.role === 'Parent';
  const canCreate = !isStudent; // Teacher/Admin (full form) and Parent (simplified form) can both create

  const [tab, setTab] = useState<DiaryEntryScope>('class');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [myChildren, setMyChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<DiaryEntryScope>('class');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<DiaryEntryCategory>('General');
  const [content, setContent] = useState('');

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    const calls: Promise<any>[] = [api.getDiaryEntries(), user?.tenantId ? api.getClasses(user.tenantId!) : Promise.resolve([])];
    if (canCreate && !isParent && user?.tenantId) {
      calls.push(api.getStudents(user.tenantId!));
    }
    if (isParent) {
      calls.push(api.getMyLinkedStudents().then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id)))));
    }
    Promise.all(calls)
      .then(([e, c, s]) => {
        setEntries(e);
        setClasses(c);
        if (isParent) {
          setMyChildren(s ?? []);
        } else if (s) {
          setStudents(s);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load diary entries'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDiaryEntry(
        isParent
          ? { scope: 'student', student_id: studentId, category, content }
          : { class_id: classId, scope, student_id: scope === 'student' ? studentId : undefined, category, content },
      );
      setShowForm(false);
      setScope('class');
      setClassId('');
      setStudentId('');
      setCategory('General');
      setContent('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create diary entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleReply(entryId: string) {
    const text = replyDrafts[entryId]?.trim();
    if (!text) return;
    setSubmittingReplyId(entryId);
    setError(null);
    try {
      await api.addDiaryReply(entryId, text);
      setReplyDrafts((prev) => ({ ...prev, [entryId]: '' }));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post reply');
    } finally {
      setSubmittingReplyId(null);
    }
  }

  async function handleDelete(entryId: string) {
    setError(null);
    try {
      await api.deleteDiaryEntry(entryId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete entry');
    }
  }

  function className(id: string): string {
    const c = classes.find((c) => c.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : id;
  }

  const filtered = entries.filter((e) => e.scope === tab);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setTab('class')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-body font-medium transition-colors ${
              tab === 'class' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <BookOpen size={16} /> Class Diary
          </button>
          <button
            onClick={() => setTab('student')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-body font-medium transition-colors ${
              tab === 'student' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageCircle size={16} /> Student Diary
          </button>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Entry
          </Button>
        )}
      </div>

      {showForm && canCreate && (
        <Card title={isParent ? 'New Note to Teacher' : 'New Diary Entry'}>
          <form onSubmit={handleCreate} className="space-y-3">
            {isParent ? (
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Which child is this about?</option>
                {myChildren.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <div className="flex gap-3">
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as DiaryEntryScope)}
                    className="rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="class">Class-wide</option>
                    <option value="student">Specific Student</option>
                  </select>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DiaryEntryCategory)}
                    className="rounded-button border border-border px-3 py-2 text-body"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  <option value="">Select a class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade_level}
                      {c.section ? ` - ${c.section}` : ''}
                    </option>
                  ))}
                </select>
                {scope === 'student' && (
                  <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
                )}
              </>
            )}
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isParent ? 'Write a note for the teacher…' : 'Write the entry…'}
              rows={3}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowForm(false)} className="bg-white text-text-primary border border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Post Entry'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card title={tab === 'class' ? 'Class Diary' : 'Student Diary'}>
          <p className="py-6 text-center text-body text-text-secondary">No diary entries yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone={categoryTone(entry.category)}>{entry.category}</Badge>
                  <span className="font-mono text-caption text-text-secondary">{entry.entry_date}</span>
                  <span className="text-caption text-text-secondary">· {className(entry.class_id)}</span>
                </div>
                {!isStudent && (
                  <button onClick={() => handleDelete(entry.id)} className="text-text-secondary hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-body text-text-primary">{entry.content}</p>

              {entry.replies?.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
                  {entry.replies.map((r) => (
                    <p key={r.id} className="text-body text-text-secondary">
                      {r.content}
                    </p>
                  ))}
                </div>
              )}

              {!isStudent && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyDrafts[entry.id] ?? ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                    placeholder="Write a reply…"
                    className="flex-1 rounded-button border border-border px-3 py-2 text-body"
                  />
                  <Button
                    onClick={() => handleReply(entry.id)}
                    disabled={submittingReplyId === entry.id}
                    className="flex items-center gap-1.5"
                  >
                    <Send size={14} />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

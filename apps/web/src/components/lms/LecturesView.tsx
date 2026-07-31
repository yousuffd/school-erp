'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, Video } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isStudentRole } from '@/lib/roles';
import { AcademicYear, Lecture, LectureProgress, SchoolClass, Subject } from '@/lib/types';

export function LecturesView() {
  const user = auth.getUser();
  const isStudent = isStudentRole(user?.role);

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});

  function load() {
    if (!user) return;
    setLoading(true);
    const listPromise = isStudent ? api.getMyLectures() : api.getLectures(user.tenantId!);
    Promise.all([
      listPromise,
      isStudent ? api.getMyLectureProgress() : Promise.resolve<LectureProgress[]>([]),
      isStudent ? Promise.resolve([]) : api.getSubjects(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getClasses(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getAcademicYears(user.tenantId!),
    ])
      .then(([l, progress, s, c, y]) => {
        setLectures(l);
        setWatched(new Set(progress.map((p) => p.lecture_id)));
        setSubjects(s);
        setClasses(c);
        setAcademicYears(y);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!user || !file) return;
    setSaving(true);
    setError(null);
    try {
      const currentYear = academicYears.find((y) => y.is_current) ?? academicYears[0];
      if (!currentYear) {
        setError('No academic year exists yet.');
        setSaving(false);
        return;
      }
      await api.createLecture({
        tenant_id: user.tenantId!,
        subject_id: subjectId,
        school_class_id: classId,
        academic_year_id: currentYear.id,
        title,
        description: description || undefined,
        file,
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setSubjectId('');
      setClassId('');
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload lecture');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkWatched(id: string) {
    try {
      await api.markLectureWatched(id);
      setWatched((prev) => new Set(prev).add(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark as watched');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lecture?')) return;
    try {
      await api.deleteLecture(id);
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
    <Card
      title="Lecture Videos"
      action={
        !isStudent ? (
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Upload Lecture
          </Button>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-3 text-body text-danger">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleUpload} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
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
            <label className="mb-1 block text-caption text-text-secondary">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-caption text-text-secondary">Video file (MP4, WebM, or MOV)</label>
            <input
              required
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-body"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : lectures.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No lectures yet.</p>
      ) : (
        <div className="space-y-3">
          {lectures.map((l) => (
            <div key={l.id} className="rounded-card border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-accent" />
                  <div>
                    <p className="text-body font-medium text-text-primary">{l.title}</p>
                    {!isStudent && (
                      <p className="text-caption text-text-secondary">
                        {subjectName(l.subject_id)} · {className(l.school_class_id)}
                      </p>
                    )}
                  </div>
                  {isStudent && watched.has(l.id) && (
                    <Badge tone="success">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} /> Watched
                      </span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (playingId === l.id) {
                        setPlayingId(null);
                        return;
                      }
                      if (!streamUrls[l.id]) {
                        try {
                          const url = await api.getLectureStreamUrl(l.id);
                          setStreamUrls((prev) => ({ ...prev, [l.id]: url }));
                        } catch (err) {
                          setError(err instanceof ApiError ? err.message : 'Failed to load video');
                          return;
                        }
                      }
                      setPlayingId(l.id);
                    }}
                    className="text-caption font-medium text-accent hover:underline"
                  >
                    {playingId === l.id ? 'Hide Player' : 'Play'}
                  </button>
                  {!isStudent && (
                    <button onClick={() => handleDelete(l.id)} className="text-danger hover:opacity-70">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              {l.description && <p className="mt-2 text-caption text-text-secondary">{l.description}</p>}
              {playingId === l.id && (
                <div className="mt-3">
                  <video controls className="w-full max-w-2xl rounded-card" src={streamUrls[l.id]} />
                  {isStudent && !watched.has(l.id) && (
                    <button
                      onClick={() => handleMarkWatched(l.id)}
                      className="mt-2 flex items-center gap-1.5 text-caption font-medium text-accent hover:underline"
                    >
                      <CheckCircle2 size={14} /> Mark as watched
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

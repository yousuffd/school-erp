'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isStudentRole } from '@/lib/roles';
import { AcademicYear, LearningResource, SchoolClass, Subject } from '@/lib/types';

export function ResourcesView() {
  const user = auth.getUser();
  const isStudent = isStudentRole(user?.role);

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    const listPromise = isStudent ? api.getMyResources() : api.getResources(user.tenantId!);
    Promise.all([
      listPromise,
      isStudent ? Promise.resolve([]) : api.getSubjects(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getClasses(user.tenantId!),
      isStudent ? Promise.resolve([]) : api.getAcademicYears(user.tenantId!),
    ])
      .then(([r, s, c, y]) => {
        setResources(r);
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
      await api.createResource({
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
      setError(err instanceof ApiError ? err.message : 'Failed to upload resource');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resource?')) return;
    try {
      await api.deleteResource(id);
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
      title="Resources"
      action={
        !isStudent ? (
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Upload Resource
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
            <input
              required
              type="file"
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
      ) : resources.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No resources yet.</p>
      ) : (
        <div className="space-y-2">
          {resources.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <div>
                  <p className="text-body font-medium text-text-primary">{r.title}</p>
                  {!isStudent && (
                    <p className="text-caption text-text-secondary">
                      {subjectName(r.subject_id)} · {className(r.school_class_id)}
                    </p>
                  )}
                  {r.description && <p className="text-caption text-text-secondary">{r.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => api.downloadResourceFile(r.id, r.original_filename)}
                  className="flex items-center gap-1 text-caption text-accent hover:underline"
                >
                  <Download size={12} /> Download
                </button>
                {!isStudent && (
                  <button onClick={() => handleDelete(r.id)} className="text-danger hover:opacity-70">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

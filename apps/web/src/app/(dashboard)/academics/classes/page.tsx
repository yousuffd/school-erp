'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Users2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Campus, ClassElectiveOffering, SchoolClass, Subject, User } from '@/lib/types';

export default function ClassesPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offeringsByClass, setOfferingsByClass] = useState<Record<string, ClassElectiveOffering[]>>({});
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [addingSubjectId, setAddingSubjectId] = useState('');

  const [form, setForm] = useState({
    campus_id: '',
    grade_level: '',
    section: '',
    class_teacher_id: '',
  });

  function load() {
    if (!user) return;
    setLoading(true);
    setError(null);

    api.getClasses(user.tenantId!).then(setClasses).catch((err) => setError(err.message));
    api.getCampuses(user.tenantId!).then(setCampuses).catch(() => setCampuses([]));
    api.getSubjects(user.tenantId!).then(setSubjects).catch(() => setSubjects([]));
    // Users list requires user-management:view — Admin-tier roles have it,
    // Teacher doesn't. Failing silently here just means Teacher won't see
    // named class teachers in this dropdown (they can't create classes anyway).
    api
      .getUsers(user.tenantId!)
      .then((all) => setTeachers(all))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const years = await api.getAcademicYears(user.tenantId!);
      const currentYear = years.find((y) => y.is_current) ?? years[0];
      if (!currentYear) {
        setError('No academic year exists yet — create one under Settings first.');
        setSaving(false);
        return;
      }
      await api.createClass({
        tenant_id: user.tenantId!,
        campus_id: form.campus_id,
        academic_year_id: currentYear.id,
        grade_level: form.grade_level,
        section: form.section || undefined,
        class_teacher_id: form.class_teacher_id || undefined,
      });
      setForm({ campus_id: '', grade_level: '', section: '', class_teacher_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create class');
    } finally {
      setSaving(false);
    }
  }

  function teacherName(id?: string) {
    if (!id) return 'Unassigned';
    return teachers.find((t) => t.id === id)?.name ?? 'Unassigned';
  }

  function electiveSubjects(): Subject[] {
    return subjects.filter((s) => s.is_elective);
  }

  function subjectName(id: string): string {
    return subjects.find((s) => s.id === id)?.name ?? 'Unknown';
  }

  async function toggleExpanded(classId: string) {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
      return;
    }
    setExpandedClassId(classId);
    if (!offeringsByClass[classId]) {
      try {
        const offerings = await api.getClassElectiveOfferings(classId);
        setOfferingsByClass((prev) => ({ ...prev, [classId]: offerings }));
      } catch (err) {
        setOfferingsByClass((prev) => ({ ...prev, [classId]: [] }));
      }
    }
  }

  async function handleAddOffering(classId: string) {
    if (!user || !addingSubjectId) return;
    try {
      await api.createClassElectiveOffering({
        tenant_id: user.tenantId!,
        school_class_id: classId,
        subject_id: addingSubjectId,
      });
      const offerings = await api.getClassElectiveOfferings(classId);
      setOfferingsByClass((prev) => ({ ...prev, [classId]: offerings }));
      setAddingSubjectId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add elective offering');
    }
  }

  async function handleRemoveOffering(classId: string, offeringId: string) {
    try {
      await api.deleteClassElectiveOffering(offeringId);
      const offerings = await api.getClassElectiveOfferings(classId);
      setOfferingsByClass((prev) => ({ ...prev, [classId]: offerings }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove elective offering');
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
          title="All Classes"
          action={
            canManage && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Class
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
                <label className="mb-1 block text-caption text-text-secondary">Grade Level</label>
                <input
                  required
                  value={form.grade_level}
                  onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                  placeholder="Grade 5"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Section (optional)</label>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="A"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Campus</label>
                <select
                  required
                  value={form.campus_id}
                  onChange={(e) => setForm({ ...form, campus_id: e.target.value })}
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
                <label className="mb-1 block text-caption text-text-secondary">Class Teacher (optional)</label>
                <select
                  value={form.class_teacher_id}
                  onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Class'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : classes.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No classes yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <div key={c.id} className="rounded-card border border-border p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-button bg-accent-light">
                    <Users2 size={18} className="text-accent" />
                  </div>
                  <div className="font-medium text-text-primary">
                    {c.grade_level}
                    {c.section ? ` - ${c.section}` : ''}
                  </div>
                  <div className="text-caption text-text-secondary">Class Teacher: {teacherName(c.class_teacher_id)}</div>

                  {canManage && (
                    <button
                      onClick={() => toggleExpanded(c.id)}
                      className="mt-2 text-caption font-medium text-accent hover:underline"
                    >
                      {expandedClassId === c.id ? 'Hide electives' : 'Manage electives'}
                    </button>
                  )}

                  {expandedClassId === c.id && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {(offeringsByClass[c.id] ?? []).length === 0 ? (
                        <p className="text-caption text-text-secondary">No electives offered yet.</p>
                      ) : (
                        (offeringsByClass[c.id] ?? []).map((o) => (
                          <div key={o.id} className="flex items-center justify-between text-caption">
                            <span className="text-text-primary">{subjectName(o.subject_id)}</span>
                            <button
                              onClick={() => handleRemoveOffering(c.id, o.id)}
                              className="text-danger hover:opacity-70"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                      <div className="flex gap-2 pt-1">
                        <select
                          value={addingSubjectId}
                          onChange={(e) => setAddingSubjectId(e.target.value)}
                          className="flex-1 rounded-button border border-border px-2 py-1 text-caption"
                        >
                          <option value="">Add elective…</option>
                          {electiveSubjects()
                            .filter((s) => !(offeringsByClass[c.id] ?? []).some((o) => o.subject_id === s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleAddOffering(c.id)}
                          disabled={!addingSubjectId}
                          className="rounded-button bg-accent px-3 py-1 text-caption font-medium text-white disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
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

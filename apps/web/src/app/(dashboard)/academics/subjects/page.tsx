'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Subject, User, TeacherSubjectSpecialization } from '@/lib/types';

function TeacherAssignmentsCard({
  tenantId,
  subjects,
  canManage,
}: {
  tenantId: string;
  subjects: Subject[];
  canManage: boolean;
}) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [specs, setSpecs] = useState<TeacherSubjectSpecialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.getUsers(tenantId),
      api.getRoles(tenantId),
      api.getTeacherSpecializations(tenantId),
    ])
      .then(([users, roles, specializations]) => {
        const teacherRole = roles.find((r) => r.name === 'Teacher');
        setTeachers(teacherRole ? users.filter((u) => u.role_id === teacherRole.id) : []);
        setSpecs(specializations);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  const subjectIdByTeacherId = useMemo(
    () => new Map(specs.map((s) => [s.teacher_id, s.subject_id])),
    [specs],
  );

  async function handleAssign(teacherId: string, subjectId: string) {
    if (!subjectId) return;
    setSavingId(teacherId);
    setError(null);
    try {
      await api.assignTeacherSpecialization({ tenant_id: tenantId, teacher_id: teacherId, subject_id: subjectId });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign subject');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card title="Teacher Subject Assignments">
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}
      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : teachers.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No teachers found.</p>
      ) : (
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 text-left font-medium">Teacher</th>
              <th className="py-2 text-left font-medium">Email</th>
              <th className="py-2 text-left font-medium">Subject</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="py-3 font-medium text-text-primary">{t.name}</td>
                <td className="py-3 text-text-secondary">{t.email}</td>
                <td className="py-3">
                  <select
                    disabled={!canManage || savingId === t.id}
                    value={subjectIdByTeacherId.get(t.id) ?? ''}
                    onChange={(e) => handleAssign(t.id, e.target.value)}
                    className="w-full max-w-xs rounded-button border border-border px-3 py-2 text-body disabled:opacity-60"
                  >
                    <option value="">Unassigned</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default function SubjectsPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isElective, setIsElective] = useState(false);
  const [electiveGroup, setElectiveGroup] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    api
      .getSubjects(user.tenantId!)
      .then(setSubjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createSubject({
        tenant_id: user.tenantId!,
        name,
        code,
        description: description || undefined,
        is_elective: isElective,
        elective_group: isElective && electiveGroup ? electiveGroup : undefined,
      });
      setName('');
      setCode('');
      setDescription('');
      setIsElective(false);
      setElectiveGroup('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create subject');
    } finally {
      setSaving(false);
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
          title="All Subjects"
          action={
            canManage && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Subject
              </Button>
            )
          }
        >
          {showForm && canManage && (
            <form
              onSubmit={handleCreate}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mathematics"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Code</label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="MATH"
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-body text-text-primary">
                  <input
                    type="checkbox"
                    checked={isElective}
                    onChange={(e) => setIsElective(e.target.checked)}
                  />
                  Elective subject
                </label>
              </div>
              {isElective && (
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">
                    Elective Group (e.g. Language)
                  </label>
                  <input
                    value={electiveGroup}
                    onChange={(e) => setElectiveGroup(e.target.value)}
                    placeholder="Language"
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
              )}
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Subject'}
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : subjects.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No subjects yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <div key={s.id} className="rounded-card border border-border p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-button bg-accent-light">
                    <BookOpen size={18} className="text-accent" />
                  </div>
                  <div className="font-medium text-text-primary">{s.name}</div>
                  <div className="font-mono text-caption text-text-secondary">{s.code}</div>
                  {s.is_elective && (
                    <div className="mt-1 inline-block rounded-full bg-accent-light px-2 py-0.5 text-caption text-accent">
                      Elective{s.elective_group ? ` · ${s.elective_group}` : ''}
                    </div>
                  )}
                  {s.description && <div className="mt-1 text-caption text-text-secondary">{s.description}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <TeacherAssignmentsCard tenantId={user?.tenantId ?? ''} subjects={subjects} canManage={canManage} />
      </div>
  );
}
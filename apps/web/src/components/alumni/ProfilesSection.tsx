'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { AlumniProfile, Student, SchoolClass } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

export function ProfilesSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'alumni', 'create');
  const canEdit = hasPermission(user, 'alumni', 'edit');
  const canDelete = hasPermission(user, 'alumni', 'delete');

  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getAlumniProfiles(user.tenantId!), api.getStudents(user.tenantId!), api.getClasses(user.tenantId!)])
      .then(([p, s, c]) => {
        setProfiles(p);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setStudentId('');
    setGraduationYear('');
    setOccupation('');
    setEmployer('');
    setCity('');
    setEmail('');
    setPhone('');
    setLinkedin('');
    setBio('');
  }

  function startEdit(p: AlumniProfile) {
    setEditingId(p.id);
    setStudentId(p.student_id);
    setGraduationYear(String(p.graduation_year));
    setOccupation(p.current_occupation ?? '');
    setEmployer(p.current_employer ?? '');
    setCity(p.current_city ?? '');
    setEmail(p.contact_email ?? '');
    setPhone(p.contact_phone ?? '');
    setLinkedin(p.linkedin_url ?? '');
    setBio(p.bio ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const shared = {
      current_occupation: occupation || undefined,
      current_employer: employer || undefined,
      current_city: city || undefined,
      contact_email: email || undefined,
      contact_phone: phone || undefined,
      linkedin_url: linkedin || undefined,
      bio: bio || undefined,
    };
    try {
      if (editingId) {
        await api.updateAlumniProfile(editingId, shared);
      } else {
        await api.createAlumniProfile({
          tenant_id: user.tenantId!,
          student_id: studentId,
          graduation_year: Number(graduationYear),
          ...shared,
        });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save alumni profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteAlumniProfile(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete profile');
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Alumni Directory"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> New Profile
            </Button>
          ) : undefined
        }
      >
        {canCreate && showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            {!editingId && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-caption text-text-secondary">Student</label>
                <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} />
                <p className="mt-1 text-caption text-text-secondary">
                  Note: this list isn&apos;t filtered to students marked &quot;alumni&quot; yet — verify status before creating a profile.
                </p>
              </div>
            )}
            {!editingId && (
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Graduation Year</label>
                <input required type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Occupation</label>
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Employer</label>
              <input value={employer} onChange={(e) => setEmployer(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Contact Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Contact Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">LinkedIn URL</label>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || (!editingId && !studentId)}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Profile'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No alumni profiles yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Class of</th>
                  <th className="py-2 px-3 font-medium">Occupation</th>
                  <th className="py-2 px-3 font-medium">City</th>
                  <th className="py-2 px-3 font-medium">Contact</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{studentName(p.student_id)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{p.graduation_year}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">
                      {p.current_occupation ?? '—'}{p.current_employer ? ` @ ${p.current_employer}` : ''}
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{p.current_city ?? '—'}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{p.contact_email ?? '—'}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button onClick={() => startEdit(p)} className="text-text-secondary hover:text-accent" title="Edit">
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(p.id)} className="text-text-secondary hover:text-danger" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
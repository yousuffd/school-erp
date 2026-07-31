'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { Role, Campus, User, TimetableSlot } from '@/lib/types';

/** Maps User.status → the Badge tone that best matches its meaning (DESIGN_SYSTEM.md §4 Status Badges). */
function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'invited':
      return 'warning';
    case 'disabled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function UsersPage() {
  const user = auth.getUser();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formCampusId, setFormCampusId] = useState('');

  // Edit state — inline per-row edit form for name/phone/status.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editCampusId, setEditCampusId] = useState('');
  const [editStatus, setEditStatus] = useState<'invited' | 'active' | 'disabled'>('active');

  // Reassignment prompt — shown after successfully disabling a Teacher who
  // has existing timetable slots, so the Admin doesn't silently leave
  // classes with a teacher who's no longer active.
  const [reassignPrompt, setReassignPrompt] = useState<{ teacherName: string; slots: TimetableSlot[] } | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getUsers(user.tenantId!),
      api.getRoles(user.tenantId!),
      api.getCampuses(user.tenantId!),
    ])
      .then(([u, r, c]) => {
        setUsers(u);
        setRoles(r);
        setCampuses(c);
      })
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
      await api.createUser({
        tenant_id: user.tenantId!,
        campus_id: formCampusId || undefined,
        role_id: formRoleId,
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
        password: formPassword || undefined,
      });
      setShowForm(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      setFormRoleId('');
      setFormCampusId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone ?? '');
    setEditRoleId(u.role_id);
    setEditCampusId(u.campus_id ?? '');
    setEditStatus(u.status as 'invited' | 'active' | 'disabled');
  }

  async function handleSaveEdit(u: User) {
    setEditSaving(true);
    setError(null);
    // Checked against the ORIGINAL role (before this edit), since that's
    // what actually had timetable slots — a role change in the same edit
    // wouldn't retroactively create slots for the new role.
    const isTeacher = roleNameById.get(u.role_id) === 'Teacher';
    const turningInactive = u.status !== 'disabled' && editStatus === 'disabled';
    try {
      await api.updateUser(u.id, {
        name: editName,
        email: editEmail,
        phone: editPhone || undefined,
        role_id: editRoleId,
        campus_id: editCampusId || undefined,
        status: editStatus,
      });
      setEditingId(null);

      // Turning a Teacher Inactive (from ANY prior status, not just
      // Active — a fix from the first version, which only checked
      // Active -> Inactive and missed Invited -> Inactive) always
      // surfaces this prompt, even with zero existing slots, as a
      // deliberate workflow reminder to check the timetable.
      if (isTeacher && turningInactive && user) {
        const slots = await api.getTimetableForTeacher(user.tenantId!, u.id).catch(() => []);
        setReassignPrompt({ teacherName: u.name, slots });
      }

      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  }

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);
  const campusNameById = useMemo(() => new Map(campuses.map((c) => [c.id, c.name])), [campuses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && u.role_id !== roleFilter) return false;
      if (campusFilter !== 'all' && (u.campus_id ?? '') !== campusFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, campusFilter, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {reassignPrompt && (
        <div className="rounded-card border border-warning/20 bg-warning/10 p-4 text-body text-text-primary">
          <div className="mb-2 flex items-center gap-2 font-medium text-warning">
            <AlertTriangle size={16} />
            {reassignPrompt.teacherName} is now Inactive.
          </div>
          <p className="mb-3 text-caption text-text-secondary">
            {reassignPrompt.slots.length > 0
              ? `They still have ${reassignPrompt.slots.length} timetable slot${reassignPrompt.slots.length === 1 ? '' : 's'} assigned — go to Academics → Timetable for the affected class(es) to remove or reassign these to another teacher.`
              : 'No existing timetable slots are assigned to them, so no immediate reassignment is needed — but confirm no upcoming classes still expect them.'}
          </p>
          <Button variant="secondary" onClick={() => setReassignPrompt(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card
        title="All Users"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add User
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Name</label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Email</label>
              <input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Phone (optional)</label>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Role</label>
              <select
                required
                value={formRoleId}
                onChange={(e) => setFormRoleId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Campus (optional)</label>
              <select
                value={formCampusId}
                onChange={(e) => setFormCampusId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">All campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Password (optional — leave blank to invite)</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </form>
        )}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-button border border-border px-3 py-2 text-body sm:col-span-2"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="all">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="w-full rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="all">All campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No users match these filters.</p>
        ) : (
          <table className="w-full text-body">
            <thead>
              <tr className="border-b border-border text-caption text-text-secondary">
                <th className="py-2 text-left font-medium">Name</th>
                <th className="py-2 text-left font-medium">Email</th>
                <th className="py-2 text-left font-medium">Role</th>
                <th className="py-2 text-left font-medium">Campus</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Phone</th>
                <th className="py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) =>
                editingId === u.id ? (
                  <tr key={u.id} className="border-b border-border bg-canvas last:border-0">
                    <td className="py-2 pr-2" colSpan={7}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Name</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Phone</label>
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Role</label>
                          <select
                            value={editRoleId}
                            onChange={(e) => setEditRoleId(e.target.value)}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Campus</label>
                          <select
                            value={editCampusId}
                            onChange={(e) => setEditCampusId(e.target.value)}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          >
                            <option value="">All campuses</option>
                            {campuses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as 'invited' | 'active' | 'disabled')}
                            className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                          >
                            <option value="active">Active</option>
                            <option value="disabled">Inactive</option>
                          </select>
                        </div>
                        <div className="flex items-end gap-2 sm:col-span-3">
                          <Button onClick={() => handleSaveEdit(u)} disabled={editSaving}>
                            {editSaving ? 'Saving…' : 'Save'}
                          </Button>
                          <Button variant="secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-text-primary">{u.name}</td>
                    <td className="py-3 text-text-secondary">{u.email}</td>
                    <td className="py-3 text-text-secondary">{roleNameById.get(u.role_id) ?? '—'}</td>
                    <td className="py-3 text-text-secondary">
                      {u.campus_id ? (campusNameById.get(u.campus_id) ?? '—') : 'All campuses'}
                    </td>
                    <td className="py-3">
                      <Badge tone={statusTone(u.status)}>{u.status === 'disabled' ? 'inactive' : u.status}</Badge>
                    </td>
                    <td className="py-3 font-mono text-caption text-text-secondary">{u.phone ?? '—'}</td>
                    <td className="py-3">
                      <button
                        onClick={() => startEdit(u)}
                        aria-label="Edit user"
                        className="text-text-secondary hover:text-accent"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
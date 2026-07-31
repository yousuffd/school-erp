'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Lock, Plus, Save, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { Role, RolePermission } from '@/lib/types';


const ACTIONS: RolePermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

function hasPermission(permissions: RolePermission[], module: string, action: string) {
  return permissions.some((p) => p.module === module && p.action === action);
}

function togglePermission(
  permissions: RolePermission[],
  module: string,
  action: RolePermission['action'],
): RolePermission[] {
  const exists = hasPermission(permissions, module, action);
  return exists
    ? permissions.filter((p) => !(p.module === module && p.action === action))
    : [...permissions, { module, action }];
}

export default function RolesPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<string[]>([]);

  // Local draft of each custom role's permissions, keyed by role id — lets the
  // person toggle several checkboxes before saving, rather than firing a PATCH
  // per click.
  const [drafts, setDrafts] = useState<Record<string, RolePermission[]>>({});
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getRoles(user.tenantId!), api.getRoleModules()])
      .then(([rolesData, modulesData]) => {
        setRoles(rolesData);
        setModules(modulesData);
        const nextDrafts: Record<string, RolePermission[]> = {};
        rolesData.forEach((r) => {
          if (!r.is_system_role) nextDrafts[r.id] = r.permissions;
        });
        setDrafts(nextDrafts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createRole(user.tenantId!, newRoleName);
      setNewRoleName('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create role');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(roleId: string, module: string, action: RolePermission['action']) {
    setDrafts((prev) => ({
      ...prev,
      [roleId]: togglePermission(prev[roleId] ?? [], module, action),
    }));
  }

  async function handleSavePermissions(roleId: string) {
    setSavingRoleId(roleId);
    setError(null);
    try {
      await api.updateRolePermissions(roleId, drafts[roleId] ?? []);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save permissions');
    } finally {
      setSavingRoleId(null);
    }
  }

  function isDirty(role: Role) {
    const draft = drafts[role.id] ?? [];
    if (draft.length !== role.permissions.length) return true;
    return !draft.every((p) => hasPermission(role.permissions, p.module, p.action));
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card
          title="Roles"
          action={
            canManage && (
              <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                <Plus size={16} /> New Custom Role
              </Button>
            )
          }
        >
          {showForm && canManage && (
            <form
              onSubmit={handleCreateRole}
              className="mb-5 flex items-end gap-3 rounded-card border border-border bg-canvas p-4"
            >
              <div className="flex-1">
                <label className="mb-1 block text-caption text-text-secondary">Role Name</label>
                <input
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Front Office Staff"
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create Role'}
              </Button>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-caption text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Role</th>
                    {modules.map((m) => (
                      <th key={m} className="py-2 pr-4 font-medium">
                        {m}
                      </th>
                    ))}
                    <th className="py-2 pr-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const draft = drafts[role.id] ?? role.permissions;
                    const editable = !role.is_system_role && canManage;
                    return (
                      <tr key={role.id} className="border-b border-border last:border-0 align-top">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2 font-medium text-text-primary">
                            {role.is_system_role ? (
                              <ShieldCheck size={16} className="text-accent" />
                            ) : (
                              <Lock size={16} className="text-text-secondary" />
                            )}
                            {role.name}
                          </div>
                          {role.is_system_role ? (
                            <Badge tone="info">System role — fixed in Phase 0</Badge>
                          ) : (
                            <Badge tone="success">Custom — editable</Badge>
                          )}
                        </td>
                        {modules.map((moduleName) => (
                          <td key={moduleName} className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {ACTIONS.map((action) => {
                                const granted = hasPermission(draft, moduleName, action);
                                if (!editable) {
                                  return (
                                    <span
                                      key={action}
                                      className={
                                        granted
                                          ? 'rounded-full bg-success/10 px-2 py-0.5 text-caption font-medium text-success'
                                          : 'rounded-full bg-border px-2 py-0.5 text-caption text-text-secondary/60'
                                      }
                                    >
                                      {action}
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={() => handleToggle(role.id, moduleName, action)}
                                    className={
                                      granted
                                        ? 'rounded-full bg-success/10 px-2 py-0.5 text-caption font-medium text-success ring-1 ring-success/30 transition-colors hover:bg-success/20'
                                        : 'rounded-full bg-border px-2 py-0.5 text-caption text-text-secondary transition-colors hover:bg-text-secondary/20'
                                    }
                                  >
                                    {action}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        ))}
                        <td className="py-3 pr-4 text-right">
                          {editable && (
                            <Button
                              variant="secondary"
                              disabled={!isDirty(role) || savingRoleId === role.id}
                              onClick={() => handleSavePermissions(role.id)}
                              className="flex items-center gap-1.5"
                            >
                              <Save size={14} />
                              {savingRoleId === role.id ? 'Saving…' : 'Save'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
  );
}

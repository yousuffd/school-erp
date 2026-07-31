'use client';

import { FormEvent, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/layout/TopBar';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/roles';

export default function ProvisionTenantPage() {
  const user = auth.getUser();
  const canProvision = isSuperAdminRole(user?.role);

  const [schoolName, setSchoolName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [firstAdminName, setFirstAdminName] = useState('');
  const [firstAdminEmail, setFirstAdminEmail] = useState('');
  const [firstAdminPassword, setFirstAdminPassword] = useState('');
  const [disabledModules, setDisabledModules] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tenantId: string; subdomain: string; adminEmail: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.provisionTenant({
        school_name: schoolName,
        subdomain,
        first_admin_name: firstAdminName,
        first_admin_email: firstAdminEmail,
        first_admin_password: firstAdminPassword,
        disabled_modules: Array.from(disabledModules),
      });
      setResult({ tenantId: res.tenant.id, subdomain: res.tenant.subdomain, adminEmail: res.admin.email });
      setSchoolName('');
      setSubdomain('');
      setFirstAdminName('');
      setFirstAdminEmail('');
      setFirstAdminPassword('');
      setDisabledModules(new Set());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to provision tenant');
    } finally {
      setSaving(false);
    }
  }

  if (!canProvision) {
    return (
      <>
        <TopBar title="Provision New Tenant" description="Platform-level — Super Admin only." />
        <div className="p-6">
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            You don&apos;t have permission to provision new tenants.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Provision New Tenant" description="Create a new school tenant with its first admin login." />
      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        {result && (
          <div className="rounded-card border border-success/20 bg-success/10 p-4 text-body text-text-primary">
            <div className="font-medium text-success">Tenant provisioned successfully.</div>
            <div className="mt-1 text-caption text-text-secondary">
              Subdomain: <span className="font-mono">{result.subdomain}</span> · Tenant ID:{' '}
              <span className="font-mono">{result.tenantId}</span> · Admin login:{' '}
              <span className="font-mono">{result.adminEmail}</span>
            </div>
          </div>
        )}

        <Card title="New School">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">School Name</label>
              <input
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Subdomain</label>
              <input
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g. greenwood"
                className="w-full rounded-button border border-border px-3 py-2 text-body font-mono"
              />
            </div>

            <div className="sm:col-span-2 border-t border-border pt-4">
              <div className="mb-3 flex items-center gap-2 text-body font-medium text-text-primary">
                <Building2 size={16} className="text-accent" /> First School Admin
              </div>
            </div>

            <div>
              <label className="mb-1 block text-caption text-text-secondary">Name</label>
              <input
                required
                value={firstAdminName}
                onChange={(e) => setFirstAdminName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Email</label>
              <input
                required
                type="email"
                value={firstAdminEmail}
                onChange={(e) => setFirstAdminEmail(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={firstAdminPassword}
                onChange={(e) => setFirstAdminPassword(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>

            <div className="sm:col-span-2 border-t border-border pt-4">
              <div className="mb-2 text-body font-medium text-text-primary">Optional Modules</div>
              <p className="mb-3 text-caption text-text-secondary">
                Unchecked modules are disabled for this school from day one — can only be
                changed by re-provisioning; there is no later re-enable screen yet.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'cafeteria', label: 'Cafeteria' },
                  { key: 'health-wellness', label: 'Health & Wellness' },
                  { key: 'hostel', label: 'Hostel' },
                ].map((mod) => (
                  <label key={mod.key} className="flex items-center gap-2 text-body text-text-primary">
                    <input
                      type="checkbox"
                      checked={!disabledModules.has(mod.key)}
                      onChange={(e) =>
                        setDisabledModules((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.delete(mod.key);
                          else next.add(mod.key);
                          return next;
                        })
                      }
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Provisioning…' : 'Provision Tenant'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
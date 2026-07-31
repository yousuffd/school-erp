'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { PayrollSettings } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function PayrollSettingsSection({ tenantId }: Props) {
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [professionalTaxAmount, setProfessionalTaxAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getPayrollSettings(tenantId)
      .then((s) => {
        setSettings(s);
        setProfessionalTaxAmount(s.professional_tax_amount);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updatePayrollSettings(tenantId, professionalTaxAmount);
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Payroll Settings">
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      {saved && (
        <div className="mb-4 rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">
          Settings saved.
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="max-w-sm space-y-4">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Professional Tax (monthly, flat amount)</label>
            <input
              required
              type="number"
              value={professionalTaxAmount}
              onChange={(e) => setProfessionalTaxAmount(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
            <p className="mt-1 text-caption text-text-secondary">
              Not state-slab-specific — a single flat monthly amount deducted for every processed employee. Default is ₹200.
            </p>
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
        </form>
      )}
    </Card>
  );
}
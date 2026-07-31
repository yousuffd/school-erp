'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { AlumniProfile, Donation, DonationPaymentMethod, DonationTotal, Student } from '@/lib/types';
import { alumniLabel } from './alumni-helpers';

const METHOD_LABELS: Record<DonationPaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  other: 'Other',
};

export function DonationsSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'alumni', 'create');
  const canDelete = hasPermission(user, 'alumni', 'delete');

  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAlumniId, setFilterAlumniId] = useState('');
  const [total, setTotal] = useState<DonationTotal | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alumniId, setAlumniId] = useState('');
  const [amount, setAmount] = useState('');
  const [donationDate, setDonationDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [method, setMethod] = useState<DonationPaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getDonations(user.tenantId!, filterAlumniId || undefined),
      api.getAlumniProfiles(user.tenantId!),
      api.getStudents(user.tenantId!),
    ])
      .then(([d, p, s]) => {
        setDonations(d);
        setProfiles(p);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));

    if (filterAlumniId) {
      api.getDonationTotal(filterAlumniId).then(setTotal).catch(() => setTotal(null));
    } else {
      setTotal(null);
    }
  }

  useEffect(load, [user?.tenantId, filterAlumniId]);

  function resetForm() {
    setShowForm(false);
    setAlumniId('');
    setAmount('');
    setDonationDate('');
    setPurpose('');
    setMethod('cash');
    setNotes('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createDonation({
        tenant_id: user.tenantId!,
        alumni_id: alumniId,
        amount,
        donation_date: donationDate,
        purpose: purpose || undefined,
        payment_method: method,
        notes: notes || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record donation');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteDonation(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete donation');
    }
  }

  function profileFor(id: string) {
    return profiles.find((p) => p.id === id);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Donations & Giving"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> Record Donation
            </Button>
          ) : undefined
        }
      >
        <div className="mb-4 max-w-sm">
          <label className="mb-1 block text-caption text-text-secondary">Filter by Alumnus</label>
          <select
            value={filterAlumniId}
            onChange={(e) => setFilterAlumniId(e.target.value)}
            className="w-full rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All alumni</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{alumniLabel(p, students)}</option>
            ))}
          </select>
        </div>

        {total && (
          <div className="mb-4 rounded-card bg-canvas p-3 text-body text-text-primary">
            Total given: <span className="font-semibold">₹{total.totalDonated.toLocaleString()}</span>
            <span className="text-caption text-text-secondary"> ({total.donationCount} donations)</span>
          </div>
        )}

        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Alumnus</label>
              <select
                required
                value={alumniId}
                onChange={(e) => setAlumniId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select alumnus…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{alumniLabel(p, students)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Amount</label>
              <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input required type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as DonationPaymentMethod)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                {Object.entries(METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Purpose</label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !alumniId}>{saving ? 'Saving…' : 'Record Donation'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : donations.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No donations recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Alumnus</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Method</th>
                  <th className="py-2 px-3 font-medium">Purpose</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{alumniLabel(profileFor(d.alumni_id), students)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">₹{parseFloat(d.amount).toLocaleString()}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{d.donation_date}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{METHOD_LABELS[d.payment_method]}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{d.purpose ?? '—'}</td>
                    <td className="py-2 px-3">
                      {canDelete && (
                        <button onClick={() => handleDelete(d.id)} className="text-text-secondary hover:text-danger" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
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
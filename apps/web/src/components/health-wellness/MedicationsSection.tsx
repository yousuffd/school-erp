'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { MedicationAdministration, SchoolClass, Student } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

interface Props {
  tenantId: string;
  canEdit: boolean;
}

export function MedicationsSection({ tenantId, canEdit }: Props) {
  const [medications, setMedications] = useState<MedicationAdministration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [administeredAt, setAdministeredAt] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.getMedicationAdministrations(tenantId), api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([m, s, c]) => {
        setMedications(m);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setMedicationName('');
    setDosage('');
    setAdministeredAt('');
    setConsentConfirmed(false);
    setNotes('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createMedicationAdministration({
        tenant_id: tenantId,
        student_id: studentId,
        medication_name: medicationName,
        dosage,
        administered_at: new Date(administeredAt).toISOString(),
        consent_confirmed: consentConfirmed,
        notes: notes || undefined,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record administration');
    } finally {
      setSaving(false);
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Medication Administration"
        action={
          canEdit ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Record Administration
            </Button>
          ) : undefined
        }
      >
        {canEdit && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Medication</label>
              <input
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Dosage</label>
              <input
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 5ml"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Administered At</label>
              <input
                required
                type="datetime-local"
                value={administeredAt}
                onChange={(e) => setAdministeredAt(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-body text-text-primary">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                />
                Guardian consent confirmed
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Record Administration'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : medications.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No medication administrations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Medication</th>
                  <th className="py-2 px-3 font-medium">Dosage</th>
                  <th className="py-2 px-3 font-medium">Administered</th>
                  <th className="py-2 px-3 font-medium">Consent</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">
                      {studentName(m.student_id)}
                    </td>
                    <td className="py-2 px-3 text-body text-text-primary">{m.medication_name}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{m.dosage}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">
                      {new Date(m.administered_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      {m.consent_confirmed ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
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

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { Certificate, CertificateType, Student, SchoolClass } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

const TYPE_LABELS: Record<CertificateType, string> = {
  bonafide: 'Bonafide',
  transfer: 'Transfer',
  character: 'Character',
};

export function CertificatesSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'documents', 'create');
  const canDelete = hasPermission(user, 'documents', 'delete');

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType>('bonafide');
  const [issuedDate, setIssuedDate] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getCertificates(user.tenantId!), api.getStudents(user.tenantId!), api.getClasses(user.tenantId!)])
      .then(([c, s, cl]) => {
        setCerts(c);
        setStudents(s);
        setClasses(cl);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setCertificateType('bonafide');
    setIssuedDate('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCertificate({
        tenant_id: user.tenantId!,
        student_id: studentId,
        certificate_type: certificateType,
        issued_date: issuedDate,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to issue certificate');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteCertificate(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete certificate');
    }
  }

  async function handleDownload(id: string) {
    setError(null);
    try {
      await api.downloadCertificatePdf(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate certificate');
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
        title="Certificates"
        action={
          canCreate ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Issue Certificate
            </Button>
          ) : undefined
        }
      >
        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} required />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Certificate Type</label>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value as CertificateType)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Issued Date</label>
              <input
                required
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Issuing…' : 'Issue Certificate'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : certs.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No certificates issued yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Issued</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{studentName(c.student_id)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{TYPE_LABELS[c.certificate_type]}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{c.issued_date}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(c.id)}
                          className="text-text-secondary hover:text-accent"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-text-secondary hover:text-danger"
                            title="Delete"
                          >
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

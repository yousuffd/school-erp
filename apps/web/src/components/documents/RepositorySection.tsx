'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, Download, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { SchoolDocument, DocumentCategory, DocumentApprovalStatus, Student, SchoolClass } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  hr_policy: 'HR Policy',
  student_document: 'Student Document',
  staff_document: 'Staff Document',
  other: 'Other',
};

function approvalTone(status: DocumentApprovalStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_approval':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function RepositorySection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'documents', 'create');
  const canDelete = hasPermission(user, 'documents', 'delete');
  const canApprove = hasPermission(user, 'documents', 'approve');

  const [docs, setDocs] = useState<SchoolDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relatedStudentId, setRelatedStudentId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getDocuments(user.tenantId!), api.getStudents(user.tenantId!), api.getClasses(user.tenantId!)])
      .then(([d, s, c]) => {
        setDocs(d);
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  function resetForm() {
    setShowForm(false);
    setCategory('other');
    setTitle('');
    setDescription('');
    setRelatedStudentId('');
    setFile(null);
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!user || !file) return;
    setSaving(true);
    setError(null);
    try {
      await api.uploadDocument({
        tenant_id: user.tenantId!,
        category,
        title,
        description: description || undefined,
        related_student_id:
          category === 'student_document' && relatedStudentId ? relatedStudentId : undefined,
        file,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload document');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteDocument(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete document');
    }
  }

  async function handleDownload(doc: SchoolDocument) {
    setError(null);
    try {
      await api.downloadDocumentFile(doc.id, doc.original_filename);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download document');
    }
  }

  async function handleApprove(id: string) {
    setError(null);
    try {
      await api.updateDocumentApproval(id, 'approved');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve document');
    }
  }

  function studentName(id?: string | null) {
    if (!id) return null;
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Document Repository"
        action={
          canCreate ? (
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Upload Document
            </Button>
          ) : undefined
        }
      >
        {canCreate && showForm && (
          <form
            onSubmit={handleUpload}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            {category === 'student_document' && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-caption text-text-secondary">Related Student</label>
                <StudentPicker students={students} classes={classes} value={relatedStudentId} onChange={setRelatedStudentId} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">File</label>
              <input
                required
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Uploading…' : 'Upload'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No documents yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Title</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Related To</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{d.title}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{CATEGORY_LABELS[d.category]}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">
                      {studentName(d.related_student_id) ?? '—'}
                    </td>
                    <td className="py-2 px-3">
                      <Badge tone={approvalTone(d.approval_status)}>{d.approval_status}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(d)}
                          className="text-text-secondary hover:text-accent"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        {canApprove && d.approval_status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(d.id)}
                            className="text-text-secondary hover:text-success"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(d.id)}
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

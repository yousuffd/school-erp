'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Layers, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { ExamGroup, SchoolClass, Subject } from '@/lib/types';

interface Props {
  tenantId: string;
  subjects: Subject[];
  classes: SchoolClass[];
  refreshKey: number;
}

export function ExamGroupsList({ tenantId, subjects, classes, refreshKey }: Props) {
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getExamGroups(tenantId)
      .then(setGroups)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load exam groups'))
      .finally(() => setLoading(false));
  }, [tenantId, refreshKey]);

  function subjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? '—';
  }
  function className(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : '—';
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exam group? This only works if no marks have been entered for any section yet.')) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await api.deleteExamGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete exam group');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <Card title="Exam Groups">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  return (
    <Card title="Exam Groups" action={<span className="text-caption text-text-secondary">Bulk-scheduled batches</span>}>
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-3 text-body text-danger">{error}</div>
      )}
      {groups.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">
          No exam groups yet — use “Bulk Create” above to schedule exams across multiple subjects and classes at once.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const expanded = expandedId === g.id;
            return (
              <div key={g.id} className="rounded-card border border-border">
                <button
                  onClick={() => setExpandedId(expanded ? null : g.id)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    {expanded ? (
                      <ChevronDown size={16} className="text-text-secondary" />
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary" />
                    )}
                    <Layers size={16} className="text-accent" />
                    <span className="text-body font-medium text-text-primary">{g.name}</span>
                  </div>
                  <span className="text-caption text-text-secondary">
                    {g.subjectCount ?? 0} subject{(g.subjectCount ?? 0) === 1 ? '' : 's'} ·{' '}
                    {g.classCount ?? 0} class{(g.classCount ?? 0) === 1 ? '' : 'es'} · {g.examCount ?? 0} exams
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-border p-3">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-caption text-text-secondary">
                          <th className="py-1.5 pr-4 font-medium">Subject</th>
                          <th className="py-1.5 pr-4 font-medium">Class</th>
                          <th className="py-1.5 pr-4 font-medium">Date</th>
                          <th className="py-1.5 pr-4 font-medium">Max Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(g.exams ?? []).map((exam) => (
                          <tr key={exam.id} className="border-b border-border last:border-0">
                            <td className="py-1.5 pr-4 text-body text-text-primary">{subjectName(exam.subject_id)}</td>
                            <td className="py-1.5 pr-4 text-body text-text-primary">{className(exam.school_class_id)}</td>
                            <td className="py-1.5 pr-4 font-mono text-caption text-text-secondary">{exam.exam_date}</td>
                            <td className="py-1.5 pr-4 font-mono text-caption text-text-secondary">{exam.max_marks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deletingId === g.id}
                        className="flex items-center gap-1.5 text-caption font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        <Trash2 size={14} /> {deletingId === g.id ? 'Deleting…' : 'Delete group'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
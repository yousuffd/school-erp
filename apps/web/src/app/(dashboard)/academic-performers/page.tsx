'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingDown } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { SchoolClass } from '@/lib/types';

interface PerformerRow {
  studentId: string;
  name: string;
  grade: string;
  section: string;
  averagePercent: number;
}

function PerformerList({ rows, emptyLabel }: { rows: PerformerRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-body text-text-secondary">{emptyLabel}</p>;
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r, idx) => (
        <div key={r.studentId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="w-5 shrink-0 text-caption font-medium text-text-secondary">{idx + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="text-body font-medium text-text-primary">{r.name}</div>
            <div className="text-caption text-text-secondary">
              Grade {r.grade}
              {r.section ? ` - ${r.section}` : ''}
            </div>
          </div>
          <div className="text-body font-semibold text-text-primary">{r.averagePercent}%</div>
        </div>
      ))}
    </div>
  );
}

export default function AcademicPerformersPage() {
  const user = auth.getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [top, setTop] = useState<PerformerRow[]>([]);
  const [bottom, setBottom] = useState<PerformerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.getClasses(user.tenantId).catch(() => []).then((c) => setClasses(c ?? []));
  }, [user?.tenantId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getAcademicPerformers(selectedClassId || undefined)
      .then((data) => {
        if (cancelled) return;
        setTop(data.top);
        setBottom(data.bottom);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load academic performers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  return (
    <>
      <TopBar
        title="Academic Performers"
        description="Top and bottom 10 students by average score across every recorded exam."
      />
      <div className="space-y-5 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-caption text-text-secondary">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Grade {c.grade_level}
                {c.section ? ` - ${c.section}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Top 10">
            {loading ? (
              <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-1.5 text-caption text-success">
                  <Trophy size={14} /> Highest average score
                </div>
                <PerformerList rows={top} emptyLabel="No exam results recorded yet." />
              </>
            )}
          </Card>

          <Card title="Bottom 10">
            {loading ? (
              <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-1.5 text-caption text-danger">
                  <TrendingDown size={14} /> Lowest average score
                </div>
                <PerformerList rows={bottom} emptyLabel="No exam results recorded yet." />
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

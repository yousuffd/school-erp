'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { Exam, ExamResult } from '@/lib/types';

type ExamResultRow = ExamResult & { exam: Exam };

export function StudentExaminationsView() {
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getMyExamResults()
      .then((r) => setResults(r as ExamResultRow[]))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load exam results'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const sorted = useMemo(
    () => results.slice().sort((a, b) => (a.exam.exam_date < b.exam.exam_date ? 1 : -1)),
    [results],
  );

  // No dedicated "current academic year" endpoint that a Student account is
  // guaranteed to have permission to call, so the report card defaults to
  // the academic year of the most recent exam in the Student's own results
  // — derived client-side from data we already have, rather than a second
  // permissioned lookup. If a school needs the Student to pick among
  // multiple years explicitly, that's a small follow-up (a year dropdown
  // sourced the same way, from distinct academic_year_id values here).
  const latestAcademicYearId = sorted[0]?.exam.academic_year_id ?? null;

  async function handleDownload() {
    const studentId = auth.getUser()?.studentId;
    if (!studentId || !latestAcademicYearId) return;
    setDownloading(true);
    setError(null);
    try {
      await api.downloadReportCard(studentId, latestAcademicYearId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate report card');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <Card title="My Results">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="My Results"
        action={
          latestAcademicYearId ? (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5"
            >
              <Download size={16} /> {downloading ? 'Generating…' : 'Download Report Card'}
            </Button>
          ) : undefined
        }
      >
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No results published yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Exam</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Marks</th>
                  <th className="py-2 px-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const maxMarks = parseFloat(r.exam.max_marks);
                  const marksObtained = r.marks_obtained != null ? parseFloat(r.marks_obtained) : null;
                  const pct = marksObtained != null && maxMarks > 0 ? (marksObtained / maxMarks) * 100 : null;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2 text-body font-medium text-text-primary">
                          <FileCheck2 size={15} className="shrink-0 text-accent" />
                          {r.exam.name}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-caption text-text-secondary">{r.exam.exam_date}</td>
                      <td className="py-2 px-3 font-mono text-body text-text-primary">
                        {marksObtained != null ? `${marksObtained} / ${maxMarks}` : (
                          <Badge tone="warning">Absent</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-caption text-text-secondary">
                        {pct != null ? `${pct.toFixed(1)}%` : '—'}
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

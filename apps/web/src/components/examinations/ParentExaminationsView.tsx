'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileCheck2, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { AcademicYear, Exam, ExamResult, Student } from '@/lib/types';

type ExamResultRow = ExamResult & { exam: Exam };

/**
 * Parent's exam-results view — same "separate components per role"
 * convention as the Dashboard dispatcher, rather than overloading
 * StudentExaminationsView with dual-mode branching. Mirrors
 * ParentDashboard's child-resolution pattern (getMyLinkedStudents() only
 * returns raw link rows, so getStudent(id) is called per-link for a
 * display name — legitimate for a Parent thanks to the ownership check
 * on StudentsController.findOne) and reuses StudentExaminationsView's
 * results-table rendering, parameterized by whichever child is currently
 * selected instead of always being "me."
 *
 * Added Year + Test/Examination filters (previously had neither — every
 * result across every year showed in one flat list). Mirrors the same
 * pattern used on the Student Directory's report-card section: the Test
 * dropdown's OPTIONS come from an unfiltered fetch for the selected
 * child+year, so picking one test never removes the others from the
 * list; the actually-displayed table (and the downloaded PDF) reflect
 * whichever filters are currently selected.
 */
export function ParentExaminationsView() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [availableExamNames, setAvailableExamNames] = useState<string[]>([]);
  const [selectedExamName, setSelectedExamName] = useState('');
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMyLinkedStudents()
      .then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id))))
      .then((students) => {
        setChildren(students);
        if (students.length > 0) setSelectedStudentId(students[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your linked children'))
      .finally(() => setLoadingChildren(false));

    const user = auth.getUser();
    if (!user) return;
    api
      .getAcademicYears(user.tenantId!)
      .then((years) => {
        setAcademicYears(years);
        const current = years.find((y) => y.is_current);
        if (current) setSelectedYearId(current.id);
      })
      .catch(() => setAcademicYears([]));
  }, []);

  // Populate the Test dropdown from an UNFILTERED fetch for the selected
  // child+year, so switching tests never shrinks this list. Resets the
  // test selection whenever the child or year changes.
  useEffect(() => {
    if (!selectedStudentId || !selectedYearId) {
      setAvailableExamNames([]);
      return;
    }
    setSelectedExamName('');
    api
      .getMyExamResults(selectedYearId, selectedStudentId)
      .then((r) => setAvailableExamNames(Array.from(new Set((r as ExamResultRow[]).map((row) => row.exam.name)))))
      .catch(() => setAvailableExamNames([]));
  }, [selectedStudentId, selectedYearId]);

  // Fetch the actually-displayed results, respecting whichever test is
  // currently selected (or all of them, if "All" is selected).
  useEffect(() => {
    if (!selectedStudentId || !selectedYearId) return;
    setLoadingResults(true);
    api
      .getMyExamResults(selectedYearId, selectedStudentId, selectedExamName || undefined)
      .then((r) => setResults(r as ExamResultRow[]))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load exam results'))
      .finally(() => setLoadingResults(false));
  }, [selectedStudentId, selectedYearId, selectedExamName]);

  const sorted = useMemo(
    () => results.slice().sort((a, b) => (a.exam.exam_date < b.exam.exam_date ? 1 : -1)),
    [results],
  );

  async function handleDownload() {
    if (!selectedStudentId || !selectedYearId) return;
    setDownloading(true);
    setError(null);
    try {
      await api.downloadReportCard(selectedStudentId, selectedYearId, selectedExamName || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate report card');
    } finally {
      setDownloading(false);
    }
  }

  if (loadingChildren) {
    return (
      <Card title="Exam Results">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card title="Exam Results">
        <p className="py-6 text-center text-body text-text-secondary">
          No children are linked to your account yet — contact the school office.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        {children.length > 1 && (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-caption text-text-secondary">
              <Users size={14} /> Child
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-caption text-text-secondary">Academic Year</label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">Select…</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.is_current ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-caption text-text-secondary">Test / Examination</label>
          <select
            value={selectedExamName}
            onChange={(e) => setSelectedExamName(e.target.value)}
            disabled={availableExamNames.length === 0}
            className="rounded-button border border-border px-3 py-2 text-body disabled:opacity-50"
          >
            <option value="">All</option>
            {availableExamNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card
        title={children.length === 1 ? `${children[0].first_name}'s Results` : 'Exam Results'}
        action={
          selectedYearId ? (
            <Button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5">
              <Download size={16} /> {downloading ? 'Generating…' : 'Download Report Card'}
            </Button>
          ) : undefined
        }
      >
        {loadingResults ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : sorted.length === 0 ? (
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
                        {marksObtained != null ? `${marksObtained} / ${maxMarks}` : <Badge tone="warning">Absent</Badge>}
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

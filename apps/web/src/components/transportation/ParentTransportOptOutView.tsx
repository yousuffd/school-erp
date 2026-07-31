'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bus, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { AcademicYear, Student, StudentTransportOptOut } from '@/lib/types';

interface Props {
  tenantId: string;
}

/**
 * Parent's self-service transport opt-out toggle — same "separate
 * component per role" convention as ParentDisciplineView, and the same
 * child-resolution pattern (getMyLinkedStudents() returns raw links only,
 * so getStudent(id) is called per-link for a display name). Calls the
 * dedicated opt-outs/my-child routes (resolveParentOnlyStudentId-gated),
 * not the general opt-outs route Admin/Transportation staff use.
 */
export function ParentTransportOptOutView({ tenantId }: Props) {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [optOuts, setOptOuts] = useState<StudentTransportOptOut[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = useMemo(
    () => academicYears.find((y) => y.is_current) ?? academicYears[0],
    [academicYears],
  );

  useEffect(() => {
    Promise.all([
      api.getMyLinkedStudents().then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id)))),
      api.getAcademicYears(tenantId),
    ])
      .then(([students, years]) => {
        setChildren(students);
        setAcademicYears(years);
        if (students.length > 0) setSelectedStudentId(students[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your linked children'))
      .finally(() => setLoadingChildren(false));
  }, [tenantId]);

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoadingDetail(true);
    setError(null);
    api
      .getMyChildTransportOptOut(selectedStudentId)
      .then(setOptOuts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load opt-out status'))
      .finally(() => setLoadingDetail(false));
  }, [selectedStudentId]);

  const currentOptOut = optOuts.find((o) => o.academic_year_id === currentYear?.id);

  async function handleOptOut() {
    if (!currentYear || !selectedStudentId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.setMyChildTransportOptOut({
        tenant_id: tenantId,
        student_id: selectedStudentId,
        academic_year_id: currentYear.id,
      });
      setOptOuts((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to opt out of transport');
    } finally {
      setSaving(false);
    }
  }

  async function handleOptBackIn() {
    if (!currentYear || !selectedStudentId) return;
    setSaving(true);
    setError(null);
    try {
      await api.removeMyChildTransportOptOut(selectedStudentId, currentYear.id);
      setOptOuts((prev) => prev.filter((o) => o.academic_year_id !== currentYear.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to opt back in to transport');
    } finally {
      setSaving(false);
    }
  }

  if (loadingChildren) {
    return (
      <Card title="School Transport">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card title="School Transport">
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

      {children.length > 1 && (
        <div className="flex items-center gap-3">
          <Users size={16} className="text-text-secondary" />
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

      <Card title={children.length === 1 ? `${children[0].first_name}'s School Transport` : 'School Transport'}>
        {loadingDetail ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <Bus size={20} className={currentOptOut ? 'text-text-secondary' : 'text-success'} />
              <div>
                <p className="text-body-lg font-medium text-text-primary">
                  {currentOptOut ? 'Opted out of school transport' : 'Using school transport'}
                </p>
                <p className="text-caption text-text-secondary">
                  {currentYear ? `For the ${currentYear.label} academic year` : 'No current academic year set'}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={currentOptOut ? handleOptBackIn : handleOptOut}
              disabled={saving || !currentYear}
            >
              {saving ? 'Saving…' : currentOptOut ? 'Opt Back In' : 'Opt Out of Transport'}
            </Button>
          </div>
        )}
        <p className="mt-3 text-caption text-text-secondary">
          Opting out removes your child from the transport assignment list for this academic year — the school
          won't assign them a route or stop while opted out.
        </p>
      </Card>
    </div>
  );
}

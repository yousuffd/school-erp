'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Languages } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { ClassElectiveOffering, Student, StudentElectiveSelection, Subject } from '@/lib/types';

/**
 * Student self-service elective selection — locked in once chosen (session
 * 27 decision: only an Admin can change it after that, via a separate
 * admin-only route not exposed in this UI). Groups available options by
 * Subject.elective_group so a student picks exactly one per group (e.g.
 * one Language option), not a flat list of every elective offered.
 */
export default function MyElectivesPage() {
  const user = auth.getUser();
  const [me, setMe] = useState<Student | null>(null);
  const [offerings, setOfferings] = useState<ClassElectiveOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selections, setSelections] = useState<StudentElectiveSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  function load() {
    if (!user?.studentId) return;
    setLoading(true);
    setError(null);
    Promise.all([api.getStudent(user.studentId), api.getMyElectiveSelections()])
      .then(async ([student, mySelections]) => {
        setMe(student);
        setSelections(mySelections);
        if (student.school_class_id) {
          const [classOfferings, allSubjects] = await Promise.all([
            api.getClassElectiveOfferings(student.school_class_id),
            api.getSubjects(student.tenant_id),
          ]);
          setOfferings(classOfferings);
          setSubjects(allSubjects);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load electives'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.studentId]);

  function subjectFor(subjectId: string): Subject | undefined {
    return subjects.find((s) => s.id === subjectId);
  }

  function selectionForGroup(group: string): StudentElectiveSelection | undefined {
    return selections.find((sel) => subjectFor(sel.subject_id)?.elective_group === group);
  }

  async function handleSelect(subjectId: string) {
    setSelecting(subjectId);
    setError(null);
    try {
      const newSelection = await api.selectMyElective(subjectId);
      setSelections((prev) => [...prev, newSelection]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to select elective');
    } finally {
      setSelecting(null);
    }
  }

  // Group this class's offered electives by elective_group (e.g. "Language").
  const groups = new Map<string, Subject[]>();
  offerings.forEach((o) => {
    const subject = subjectFor(o.subject_id);
    if (!subject?.elective_group) return;
    const list = groups.get(subject.elective_group) ?? [];
    list.push(subject);
    groups.set(subject.elective_group, list);
  });

  return (
    <>
      <TopBar title="My Electives" description="Choose your elective subjects for this academic year." />
      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : !me?.school_class_id ? (
          <Card title="My Electives">
            <p className="py-6 text-center text-body text-text-secondary">
              You are not yet assigned to a class — contact your Admin.
            </p>
          </Card>
        ) : groups.size === 0 ? (
          <Card title="My Electives">
            <p className="py-6 text-center text-body text-text-secondary">
              No elective options are available for your class yet.
            </p>
          </Card>
        ) : (
          Array.from(groups.entries()).map(([group, groupSubjects]) => {
            const existing = selectionForGroup(group);
            return (
              <Card key={group} title={group}>
                {existing ? (
                  <div className="flex items-center gap-2 py-4 text-body text-text-primary">
                    <CheckCircle2 size={18} className="text-success" />
                    You selected <span className="font-medium">{subjectFor(existing.subject_id)?.name}</span>
                    <Badge tone="success">Locked in</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupSubjects.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-card border border-border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Languages size={16} className="text-accent" />
                          <span className="text-body text-text-primary">{s.name}</span>
                        </div>
                        <Button
                          onClick={() => handleSelect(s.id)}
                          disabled={selecting === s.id}
                          className="flex items-center gap-1.5"
                        >
                          {selecting === s.id ? 'Selecting…' : 'Select'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
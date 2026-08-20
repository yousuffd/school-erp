'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { SchoolClass } from '@/lib/types';

interface DefaulterRow {
  studentId: string;
  name: string;
  grade: string;
  section: string;
  assigned: number;
  paid: number;
  balance: number;
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function FeeDefaultersPage() {
  const user = auth.getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<DefaulterRow[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
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
      .getFeeDefaulters(selectedClassId || undefined)
      .then((data) => {
        if (cancelled) return;
        setStudents(data.students);
        setTotalOutstanding(data.totalOutstanding);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load fee defaulters');
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
      <TopBar title="Fee Defaulters" description="Students with an outstanding balance, most owed first." />
      <div className="space-y-5 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
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

          {!loading && students.length > 0 && (
            <div className="text-right">
              <div className="text-caption text-text-secondary">Total outstanding</div>
              <div className="text-card-title font-bold text-danger">{formatINR(totalOutstanding)}</div>
            </div>
          )}
        </div>

        <Card title={`${students.length} student${students.length === 1 ? '' : 's'} with a balance due`}>
          {loading ? (
            <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-body text-text-secondary">
              <AlertCircle className="mx-auto mb-2 text-success" size={28} />
              Everyone's paid up — nothing outstanding here.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Class</th>
                  <th className="pb-2 text-right font-medium">Assigned</th>
                  <th className="pb-2 text-right font-medium">Paid</th>
                  <th className="pb-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className="border-b border-border text-body last:border-0">
                    <td className="py-3 font-medium text-text-primary">{s.name}</td>
                    <td className="py-3 text-text-secondary">
                      Grade {s.grade}
                      {s.section ? ` - ${s.section}` : ''}
                    </td>
                    <td className="py-3 text-right text-text-secondary">{formatINR(s.assigned)}</td>
                    <td className="py-3 text-right text-text-secondary">{formatINR(s.paid)}</td>
                    <td className="py-3 text-right font-semibold text-danger">{formatINR(s.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

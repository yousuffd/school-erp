'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { Employee, LeaveRequest, PerformanceReview, Payslip } from '@/lib/types';

const LEAVE_STATUS_TONE: Record<LeaveRequest['status'], 'success' | 'danger' | 'warning'> = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MyHrPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMyEmployeeRecord(), api.getMyLeaveRequests(), api.getMyReviews(), api.getMyPayslips()])
      .then(([emp, leave, rev, pay]) => {
        setEmployee(emp);
        setLeaveRequests(leave);
        setReviews(rev);
        setPayslips(pay);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your HR record'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="My HR" description="Your employment record, leave requests, performance reviews, and payslips." />
      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : !employee ? (
          <Card title="My Profile">
            <p className="py-6 text-center text-body text-text-secondary">
              No HR profile is linked to your account yet — contact your HR Manager if this seems wrong.
            </p>
          </Card>
        ) : (
          <>
            <Card title="My Profile">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-caption text-text-secondary">Department</div>
                  <div className="font-medium text-text-primary">{employee.department}</div>
                </div>
                <div>
                  <div className="text-caption text-text-secondary">Designation</div>
                  <div className="font-medium text-text-primary">{employee.designation}</div>
                </div>
                <div>
                  <div className="text-caption text-text-secondary">Date of Joining</div>
                  <div className="font-medium text-text-primary">{employee.date_of_joining}</div>
                </div>
              </div>
            </Card>

            <Card title="My Leave Requests">
              {leaveRequests.length === 0 ? (
                <p className="py-6 text-center text-body text-text-secondary">No leave requests yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-caption text-text-secondary">
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Dates</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((l) => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 text-body text-text-primary capitalize">{l.leave_type}</td>
                        <td className="py-3 pr-4 text-body text-text-secondary">{l.from_date} → {l.to_date}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={LEAVE_STATUS_TONE[l.status]}>{l.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="My Performance Reviews">
              {reviews.length === 0 ? (
                <p className="py-6 text-center text-body text-text-secondary">No reviews yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-caption text-text-secondary">
                      <th className="py-2 pr-4 font-medium">Reviewer Type</th>
                      <th className="py-2 pr-4 font-medium">Rating</th>
                      <th className="py-2 pr-4 font-medium">Calibrated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 text-body text-text-primary capitalize">{r.reviewer_type}</td>
                        <td className="py-3 pr-4 text-body text-text-secondary">{r.rating} / 5</td>
                        <td className="py-3 pr-4 text-body text-text-secondary">
                          {r.calibrated_rating != null ? `${r.calibrated_rating} / 5` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="My Payslips">
              {payslips.length === 0 ? (
                <p className="py-6 text-center text-body text-text-secondary">No payslips yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-caption text-text-secondary">
                      <th className="py-2 pr-4 font-medium">Gross</th>
                      <th className="py-2 pr-4 font-medium">PF</th>
                      <th className="py-2 pr-4 font-medium">ESI</th>
                      <th className="py-2 pr-4 font-medium">Professional Tax</th>
                      <th className="py-2 pr-4 font-medium">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.gross_salary}</td>
                        <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.pf_employee}</td>
                        <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.esi_employee}</td>
                        <td className="py-3 pr-4 font-mono text-body text-text-secondary">{p.professional_tax}</td>
                        <td className="py-3 pr-4 font-mono text-body font-medium text-text-primary">{p.net_salary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}
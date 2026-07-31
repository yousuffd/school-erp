'use client';

import { useEffect, useState } from 'react';
import { Banknote, Download, Receipt, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StudentPicker } from '@/components/library/StudentPicker';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { FeeAssignment, FeeBalance, FeePayment, SchoolClass, Student } from '@/lib/types';

/**
 * Self-service Fees & Payments view — Parent (own linked children) or
 * Teacher (their own scoped students, via the existing StudentPicker/
 * getStudents pattern already used by Discipline's IncidentsSection).
 * Deliberately view-only: no assign/create/adjust actions exist here at
 * all — this project has no payment gateway (blueprint: reminders-first),
 * and per explicit scope decision, Student is NOT included in this module
 * (unlike Examinations/Discipline/Diary/Communication self-service).
 */
export function FeesSelfServiceView() {
  const user = auth.getUser();
  const isParent = user?.role === 'Parent';

  const [myChildren, setMyChildren] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [balance, setBalance] = useState<FeeBalance | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingTransport, setUpdatingTransport] = useState(false);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingStudents(true);
    if (isParent) {
      api
        .getMyLinkedStudents()
        .then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id))))
        .then((students) => {
          setMyChildren(students);
          if (students.length > 0) setSelectedStudentId(students[0].id);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your linked children'))
        .finally(() => setLoadingStudents(false));
    } else {
      Promise.all([api.getStudents(user.tenantId!), api.getClasses(user.tenantId!)])
        .then(([students, cls]) => {
          setAllStudents(students);
          setClasses(cls);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load students'))
        .finally(() => setLoadingStudents(false));
    }
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setAssignments([]);
      setSelectedAssignmentId('');
      return;
    }
    setLoadingAssignments(true);
    setError(null);
    api
      .getMyAccessFeeAssignments(selectedStudentId)
      .then((a) => {
        setAssignments(a);
        setSelectedAssignmentId(a[0]?.id ?? '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load fee assignments'))
      .finally(() => setLoadingAssignments(false));
  }, [selectedStudentId]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setBalance(null);
      setPayments([]);
      return;
    }
    setError(null);
    Promise.all([
      api.getMyAccessFeeBalance(selectedAssignmentId),
      api.getMyAccessFeePayments(selectedAssignmentId),
    ])
      .then(([b, p]) => {
        setBalance(b);
        setPayments(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load fee balance'));
  }, [selectedAssignmentId]);

  async function handleToggleTransport() {
    if (!selectedStudentId || !balance) return;
    setUpdatingTransport(true);
    setError(null);
    try {
      await api.setTransportPreference(selectedStudentId, !balance.transportIncluded);
      const a = await api.getMyAccessFeeAssignments(selectedStudentId);
      setAssignments(a);
      setSelectedAssignmentId(a[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update transport preference');
    } finally {
      setUpdatingTransport(false);
    }
  }

  async function handleDownload(paymentId: string) {
    setDownloadingId(paymentId);
    setError(null);
    try {
      await api.downloadMyAccessFeeReceipt(paymentId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {isParent ? (
        loadingStudents ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : myChildren.length === 0 ? (
          <Card title="Fees & Payments">
            <p className="py-6 text-center text-body text-text-secondary">
              No children are linked to your account yet — contact the school office.
            </p>
          </Card>
        ) : myChildren.length > 1 ? (
          <div className="flex items-center gap-3">
            <Users size={16} className="text-text-secondary" />
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            >
              {myChildren.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        ) : null
      ) : (
        <Card title="Select a Student">
          {loadingStudents ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : (
            <StudentPicker
              students={allStudents}
              classes={classes}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
            />
          )}
        </Card>
      )}

      {selectedStudentId && (
        <Card title="Fee Assignments">
          {loadingAssignments ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : assignments.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No fee structures assigned yet.</p>
          ) : assignments.length > 1 ? (
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assignment ({a.assigned_at.slice(0, 10)})
                </option>
              ))}
            </select>
          ) : null}
        </Card>
      )}

      {balance && (
        <Card title="Balance">
          {isParent && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-canvas p-3">
              <div>
                <div className="text-body font-medium text-text-primary">
                  Transport: {balance.transportIncluded ? 'Included' : 'Not included'}
                </div>
                <div className="text-caption text-text-secondary">
                  Switching moves this student to the {balance.transportIncluded ? 'without' : 'with'}-transport fee
                  structure for the current year.
                </div>
              </div>
              <Button variant="secondary" onClick={handleToggleTransport} disabled={updatingTransport}>
                {updatingTransport
                  ? 'Updating…'
                  : `Switch to ${balance.transportIncluded ? 'No Transport' : 'With Transport'}`}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-caption text-text-secondary">Total Owed</div>
              <div className="font-mono text-body-lg text-text-primary">{balance.totalOwed.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-caption text-text-secondary">Adjustments</div>
              <div className="font-mono text-body-lg text-text-primary">{balance.totalAdjustments.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-caption text-text-secondary">Paid</div>
              <div className="font-mono text-body-lg text-success">{balance.totalPaid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-caption text-text-secondary">Outstanding</div>
              <div
                className={`font-mono text-body-lg ${balance.outstanding > 0 ? 'text-danger' : 'text-success'}`}
              >
                {balance.outstanding.toFixed(2)}
              </div>
            </div>
          </div>

          {balance.installments.length > 0 && (
            <div className="mt-4 space-y-2">
              {balance.installments.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-card border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Banknote size={16} className="text-accent" />
                    <div>
                      <div className="text-body font-medium text-text-primary">{i.label}</div>
                      <div className="font-mono text-caption text-text-secondary">Due {i.due_date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-body text-text-primary">
                      {i.paid.toFixed(2)} / {i.amount.toFixed(2)}
                    </div>
                    <Badge tone={i.outstanding <= 0 ? 'success' : 'warning'}>
                      {i.outstanding <= 0 ? 'Paid' : `${i.outstanding.toFixed(2)} due`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedAssignmentId && (
        <Card title="Payment History">
          {payments.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-card border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-accent" />
                    <div>
                      <div className="font-mono text-body text-text-primary">{parseFloat(p.amount).toFixed(2)}</div>
                      <div className="text-caption text-text-secondary">
                        {p.payment_date} · {p.method.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(p.id)}
                    disabled={downloadingId === p.id}
                    className="flex items-center gap-1.5"
                  >
                    <Download size={14} /> {downloadingId === p.id ? '…' : 'Receipt'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarCheck, CreditCard, Download, FileCheck2, KeyRound, Mail, Pencil, Phone, Plus, ShieldAlert, UserRound } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { todayLocalDateStr } from '@/lib/local-date';
import {
  AcademicYear,
  AttendanceRecord,
  AttendanceStatus,
  FeeAssignment,
  FeeBalance,
  FeePayment,
  FeeStructure,
  PaymentMethod,
  ReportCardData,
  SchoolClass,
  Student,
  StudentStatus,
  User,
} from '@/lib/types';


const STATUS_TONE: Record<StudentStatus, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  enrolled: 'info',
  active: 'success',
  transferred: 'warning',
  withdrawn: 'danger',
  graduated: 'neutral',
  alumni: 'neutral',
  duplicate: 'danger',
};

const STATUS_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  enrolled: ['active', 'withdrawn', 'duplicate'],
  active: ['transferred', 'withdrawn', 'graduated', 'duplicate'],
  transferred: [],
  // Reversible — withdrawal is sometimes marked in error, and there was no
  // way back before this. The backend never actually restricted this
  // transition; the UI just never offered a button for it.
  withdrawn: ['enrolled', 'active'],
  graduated: ['alumni'],
  alumni: [],
  // Also reversible, in case a real student's record was flagged as a
  // duplicate by mistake.
  duplicate: ['enrolled'],
};

const ATTENDANCE_TONE: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'info',
};

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);

  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feeAssignments, setFeeAssignments] = useState<FeeAssignment[]>([]);
  const [feeStructuresById, setFeeStructuresById] = useState<Record<string, FeeStructure>>({});
  const [availableStructures, setAvailableStructures] = useState<FeeStructure[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [balance, setBalance] = useState<FeeBalance | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [reportCardYearId, setReportCardYearId] = useState('');
  const [reportCardExamName, setReportCardExamName] = useState('');
  const [availableExamNames, setAvailableExamNames] = useState<string[]>([]);
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [downloadingReportCard, setDownloadingReportCard] = useState(false);
  const [assignStructureId, setAssignStructureId] = useState('');
  const [assigningFee, setAssigningFee] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    fee_installment_id: '',
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    method: 'cash' as PaymentMethod,
    reference_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assigningClass, setAssigningClass] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
  });

  // Login Access — lets an Admin provision a real self-service login for
  // this student, linked via User.student_id (see the Users/Auth updates
  // that added this link). Nothing here yet if this student has no login.
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [studentRoleId, setStudentRoleId] = useState('');
  const [showCreateLoginForm, setShowCreateLoginForm] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const existingLogin = tenantUsers.find((u) => u.student_id === id);

  function load() {
    setLoading(true);
    api
      .getStudent(id)
      .then((s) => {
        setStudent(s);
        setEditForm({
          admission_number: s.admission_number,
          first_name: s.first_name,
          last_name: s.last_name,
          date_of_birth: s.date_of_birth,
          gender: s.gender,
          guardian_name: s.guardian_name,
          guardian_phone: s.guardian_phone,
          guardian_email: s.guardian_email ?? '',
          emergency_contact_name: s.emergency_contact_name ?? '',
          emergency_contact_phone: s.emergency_contact_phone ?? '',
          medical_notes: s.medical_notes ?? '',
        });
        api.getAttendanceForStudent(id).then(setAttendance).catch(() => setAttendance([]));

        if (user && canManage) {
          api
            .getFeeAssignmentsForStudent(id)
            .then(async (assignments) => {
              setFeeAssignments(assignments);
              const structures = await Promise.all(
                assignments.map((a) => api.getFeeStructure(a.fee_structure_id)),
              );
              const byId: Record<string, FeeStructure> = {};
              structures.forEach((st) => (byId[st.id] = st));
              setFeeStructuresById(byId);
            })
            .catch(() => setFeeAssignments([]));
          api.getFeeStructures(user.tenantId!, s.grade_level).then(setAvailableStructures).catch(() => setAvailableStructures([]));
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load student'))
      .finally(() => setLoading(false));

    if (user && canManage) {
      api.getClasses(user.tenantId!).then(setClasses).catch(() => setClasses([]));
      api.getUsers(user.tenantId!).then(setTenantUsers).catch(() => setTenantUsers([]));
      api
        .getRoles(user.tenantId!)
        .then((roles) => {
          const studentRole = roles.find((r) => r.name === 'Student');
          if (studentRole) setStudentRoleId(studentRole.id);
        })
        .catch(() => {});
    }
    if (user) {
      api
        .getAcademicYears(user.tenantId!)
        .then((years) => {
          setAcademicYears(years);
          const current = years.find((y) => y.is_current);
          if (current) setReportCardYearId(current.id);
        })
        .catch(() => setAcademicYears([]));
    }
  }

  useEffect(load, [id]);

  function loadBalance(assignmentId: string) {
    setSelectedAssignmentId(assignmentId);
    api
      .getFeeBalance(assignmentId)
      .then(setBalance)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load fee balance'));
    api
      .getFeePayments(assignmentId)
      .then(setPayments)
      .catch(() => setPayments([]));
  }

  // Populate the Test/Examination dropdown from an UNFILTERED fetch for
  // the selected year, so picking one test never removes the others from
  // the list. Resets the test selection whenever the year changes.
  useEffect(() => {
    if (!reportCardYearId) {
      setAvailableExamNames([]);
      return;
    }
    setReportCardExamName('');
    api
      .getReportCardData(id, reportCardYearId)
      .then((data) => setAvailableExamNames(Array.from(new Set(data.rows.map((r) => r.examName)))))
      .catch(() => setAvailableExamNames([]));
  }, [reportCardYearId, id]);

  async function handleViewReportCard() {
    if (!reportCardYearId) return;
    setError(null);
    try {
      const data = await api.getReportCardData(id, reportCardYearId, reportCardExamName || undefined);
      setReportCardData(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load report card');
    }
  }

  async function handleDownloadReportCard() {
    if (!reportCardYearId) return;
    setDownloadingReportCard(true);
    setError(null);
    try {
      await api.downloadReportCard(id, reportCardYearId, reportCardExamName || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download report card');
    } finally {
      setDownloadingReportCard(false);
    }
  }

  async function handleDownloadReceipt(paymentId: string) {
    setDownloadingReceiptId(paymentId);
    setError(null);
    try {
      await api.downloadFeeReceipt(paymentId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download receipt');
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  async function handleAssignFee() {
    if (!assignStructureId) return;
    setAssigningFee(true);
    setError(null);
    try {
      await api.assignFee(id, assignStructureId);
      setAssignStructureId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign fee structure');
    } finally {
      setAssigningFee(false);
    }
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    setRecordingPayment(true);
    setError(null);
    let recordedPaymentId: string | null = null;
    try {
      const payment = await api.createFeePayment({
        fee_assignment_id: selectedAssignmentId,
        fee_installment_id: paymentForm.fee_installment_id || undefined,
        amount: paymentForm.amount,
        payment_date: paymentForm.payment_date,
        method: paymentForm.method,
        reference_number: paymentForm.reference_number || undefined,
      });
      recordedPaymentId = payment.id;
      setShowPaymentForm(false);
      setPaymentForm({
        fee_installment_id: '',
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        method: 'cash',
        reference_number: '',
      });
      loadBalance(selectedAssignmentId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record payment');
      return;
    } finally {
      setRecordingPayment(false);
    }

    // Separate try/catch: the payment above already succeeded by this point
    // (it's saved, the balance is refreshed) — a failure here is a receipt-
    // generation problem, not a payment problem, and shouldn't be reported
    // as one. The payment is also still visible in Payment History with its
    // own Download button either way, so this isn't the only chance to get it.
    if (!recordedPaymentId) return;
    try {
      await api.downloadFeeReceipt(recordedPaymentId);
    } catch {
      setError(
        'Payment recorded successfully, but the receipt download failed. You can retry from the Payment History list below.',
      );
    }
  }

  async function handleStatusChange(newStatus: StudentStatus) {
    setUpdatingStatus(true);
    try {
      await api.changeStudentStatus(id, newStatus);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAssignClass() {
    if (!selectedClassId) return;
    setAssigningClass(true);
    try {
      await api.assignStudentClass(id, selectedClassId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign class');
    } finally {
      setAssigningClass(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateStudent(id, {
        admission_number: editForm.admission_number,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        date_of_birth: editForm.date_of_birth,
        gender: editForm.gender as Student['gender'],
        guardian_name: editForm.guardian_name,
        guardian_phone: editForm.guardian_phone,
        guardian_email: editForm.guardian_email || undefined,
        emergency_contact_name: editForm.emergency_contact_name || undefined,
        emergency_contact_phone: editForm.emergency_contact_phone || undefined,
        medical_notes: editForm.medical_notes || undefined,
      });
      setShowEditForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLogin(e: FormEvent) {
    e.preventDefault();
    if (!user || !student || !studentRoleId) return;
    setCreatingLogin(true);
    setError(null);
    try {
      await api.createUser({
        tenant_id: user.tenantId!,
        role_id: studentRoleId,
        student_id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: loginForm.email,
        password: loginForm.password,
      });
      setShowCreateLoginForm(false);
      setLoginForm({ email: '', password: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create login');
    } finally {
      setCreatingLogin(false);
    }
  }

  function className(classId?: string) {
    if (!classId) return 'Unassigned';
    const c = classes.find((cl) => cl.id === classId);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : classId;
  }

  if (loading) {
    return (
      <>
        <TopBar title="Student Profile" />
        <div className="p-6">
          <p className="text-body text-text-secondary">Loading…</p>
        </div>
      </>
    );
  }

  if (error || !student) {
    return (
      <>
        <TopBar title="Student Profile" />
        <div className="p-6">
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error ?? 'Student not found'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={`${student.first_name} ${student.last_name}`} description="360° student profile" />

      <div className="space-y-6 p-6">
        <button
          onClick={() => router.push('/students')}
          className="flex items-center gap-1.5 text-body text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Back to Student Directory
        </button>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent-light text-accent">
                <UserRound size={36} />
              </div>
              <h2 className="text-card-title font-bold text-text-primary">
                {student.first_name} {student.last_name}
              </h2>
              <p className="font-mono text-body text-text-secondary">{student.admission_number}</p>
              <div className="mt-3">
                <Badge tone={STATUS_TONE[student.status]}>{student.status}</Badge>
              </div>

              {STATUS_TRANSITIONS[student.status].length > 0 && (
                <div className="mt-4 w-full space-y-2 border-t border-border pt-4">
                  <p className="text-caption text-text-secondary">Change status</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STATUS_TRANSITIONS[student.status].map((next) => (
                      <Button
                        key={next}
                        variant="secondary"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(next)}
                      >
                        Mark as {next}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 w-full border-t border-border pt-4">
                <p className="mb-1 text-caption text-text-secondary">Class</p>
                <p className="mb-2 text-body font-medium text-text-primary">
                  {className(student.school_class_id)}
                  {student.roll_number ? ` · Roll #${student.roll_number}` : ''}
                </p>
                {canManage && classes.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="flex-1 rounded-button border border-border px-2 py-1.5 text-caption"
                    >
                      <option value="">Select class…</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.grade_level}
                          {c.section ? ` - ${c.section}` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      disabled={!selectedClassId || assigningClass}
                      onClick={handleAssignClass}
                    >
                      {assigningClass ? '…' : 'Assign'}
                    </Button>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="mt-4 w-full border-t border-border pt-4">
                  <p className="mb-2 text-caption text-text-secondary">Login Access</p>
                  {existingLogin ? (
                    <div className="flex items-center justify-center gap-1.5 text-body text-text-primary">
                      <KeyRound size={14} className="text-success" />
                      <span className="truncate">{existingLogin.email}</span>
                      <Badge tone={existingLogin.status === 'active' ? 'success' : 'warning'}>
                        {existingLogin.status}
                      </Badge>
                    </div>
                  ) : !showCreateLoginForm ? (
                    <button
                      onClick={() => setShowCreateLoginForm(true)}
                      disabled={!studentRoleId}
                      className="flex w-full items-center justify-center gap-1.5 rounded-button border border-border py-2 text-body text-text-primary hover:bg-canvas disabled:opacity-50"
                    >
                      <KeyRound size={14} /> Create Login
                    </button>
                  ) : (
                    <form onSubmit={handleCreateLogin} className="space-y-2 text-left">
                      <input
                        required
                        type="email"
                        placeholder="Student email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                      />
                      <input
                        required
                        type="password"
                        minLength={8}
                        placeholder="Temporary password (min 8 chars)"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={creatingLogin} className="flex-1">
                          {creatingLogin ? 'Creating…' : 'Create'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowCreateLoginForm(false)}
                          disabled={creatingLogin}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                  {!studentRoleId && !existingLogin && (
                    <p className="mt-1 text-caption text-danger">
                      No &quot;Student&quot; system role found for this tenant.
                    </p>
                  )}
                </div>
              )}

              {canManage && (
                <div className="mt-4 w-full border-t border-border pt-4">
                  <button
                    onClick={() => setShowEditForm((s) => !s)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-button border border-border py-2 text-body text-text-primary hover:bg-canvas"
                  >
                    <Pencil size={14} /> Edit Details
                  </button>
                  <p className="mt-2 text-caption text-text-secondary">
                    Made a mistake adding this student? Fix the details here, or use &quot;Mark as
                    duplicate&quot; above if this record shouldn&apos;t exist at all — it stays on record
                    but drops out of rosters and attendance.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {showEditForm && canManage && (
            <Card title="Edit Student Details" className="lg:col-span-3">
              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Admission Number</label>
                  <input
                    required
                    value={editForm.admission_number}
                    onChange={(e) => setEditForm({ ...editForm, admission_number: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">First Name</label>
                  <input
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Last Name</label>
                  <input
                    required
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-3 rounded-button bg-canvas p-3 text-caption text-text-secondary">
                  Grade and section aren&apos;t edited here — use the <strong>Assign</strong> control next
                  to &quot;Class&quot; above to move this student to a different class. That keeps their
                  grade/section display and their actual class record in sync automatically.
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Guardian Name</label>
                  <input
                    required
                    value={editForm.guardian_name}
                    onChange={(e) => setEditForm({ ...editForm, guardian_name: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Guardian Phone</label>
                  <input
                    required
                    value={editForm.guardian_phone}
                    onChange={(e) => setEditForm({ ...editForm, guardian_phone: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Guardian Email</label>
                  <input
                    type="email"
                    value={editForm.guardian_email}
                    onChange={(e) => setEditForm({ ...editForm, guardian_email: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Emergency Contact Name</label>
                  <input
                    value={editForm.emergency_contact_name}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Emergency Contact Phone</label>
                  <input
                    value={editForm.emergency_contact_phone}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-caption text-text-secondary">Medical Notes</label>
                  <textarea
                    value={editForm.medical_notes}
                    onChange={(e) => setEditForm({ ...editForm, medical_notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div className="flex gap-2 sm:col-span-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowEditForm(false)} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Basic Information" className="lg:col-span-2">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-secondary">Grade / Section</dt>
                <dd className="text-body text-text-primary">
                  {student.grade_level}
                  {student.section ? ` - ${student.section}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Date of Birth</dt>
                <dd className="font-mono text-body text-text-primary">{student.date_of_birth}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Enrollment Date</dt>
                <dd className="font-mono text-body text-text-primary">{student.enrollment_date}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Gender</dt>
                <dd className="text-body capitalize text-text-primary">
                  {student.gender.replace(/_/g, ' ')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Guardian & Emergency Contact" className="lg:col-span-2">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-secondary">Guardian</dt>
                <dd className="flex items-center gap-1.5 text-body text-text-primary">
                  <UserRound size={14} className="text-text-secondary" />
                  {student.guardian_name}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Guardian Phone</dt>
                <dd className="flex items-center gap-1.5 font-mono text-body text-text-primary">
                  <Phone size={14} className="text-text-secondary" />
                  {student.guardian_phone}
                </dd>
              </div>
              {student.guardian_email && (
                <div>
                  <dt className="text-caption text-text-secondary">Guardian Email</dt>
                  <dd className="flex items-center gap-1.5 text-body text-text-primary">
                    <Mail size={14} className="text-text-secondary" />
                    {student.guardian_email}
                  </dd>
                </div>
              )}
              {student.emergency_contact_name && (
                <div>
                  <dt className="text-caption text-text-secondary">Emergency Contact</dt>
                  <dd className="flex items-center gap-1.5 text-body text-text-primary">
                    <ShieldAlert size={14} className="text-danger" />
                    {student.emergency_contact_name}
                    {student.emergency_contact_phone ? ` — ${student.emergency_contact_phone}` : ''}
                  </dd>
                </div>
              )}
            </dl>
            {student.medical_notes && (
              <div className="mt-4 rounded-button bg-warning/10 p-3 text-body text-text-primary">
                <span className="font-medium text-warning">Medical notes: </span>
                {student.medical_notes}
              </div>
            )}
          </Card>

          {canManage && (
            <Card title="Fees" className="lg:col-span-3">
              <div className="mb-4 flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-caption text-text-secondary">Assign a Fee Structure</label>
                  <select
                    value={assignStructureId}
                    onChange={(e) => setAssignStructureId(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="">Select…</option>
                    {availableStructures
                      .filter((s) => !feeAssignments.some((a) => a.fee_structure_id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
                <Button disabled={!assignStructureId || assigningFee} onClick={handleAssignFee}>
                  {assigningFee ? 'Assigning…' : 'Assign'}
                </Button>
              </div>

              {feeAssignments.length === 0 ? (
                <p className="text-body text-text-secondary">No fee structures assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {feeAssignments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => loadBalance(a.id)}
                      className={
                        selectedAssignmentId === a.id
                          ? 'flex w-full items-center gap-2 rounded-button border border-accent bg-accent-light px-3 py-2 text-left text-body font-medium text-accent'
                          : 'flex w-full items-center gap-2 rounded-button border border-border px-3 py-2 text-left text-body text-text-primary hover:bg-canvas'
                      }
                    >
                      <CreditCard size={14} />
                      {feeStructuresById[a.fee_structure_id]?.name ?? 'Fee Structure'}
                    </button>
                  ))}
                </div>
              )}

              {balance && (
                <div className="mt-4 rounded-card border border-border p-4">
                  <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-caption text-text-secondary">Total Owed</p>
                      <p className="font-mono text-body font-medium text-text-primary">
                        {balance.totalOwed.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-text-secondary">Adjustments</p>
                      <p className="font-mono text-body font-medium text-text-primary">
                        {balance.totalAdjustments.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-text-secondary">Paid</p>
                      <p className="font-mono text-body font-medium text-success">{balance.totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-caption text-text-secondary">Outstanding</p>
                      <p
                        className={`font-mono text-body font-medium ${balance.outstanding > 0 ? 'text-danger' : 'text-success'}`}
                      >
                        {balance.outstanding.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-caption text-text-secondary">
                        <th className="py-1.5 pr-4 font-medium">Installment</th>
                        <th className="py-1.5 pr-4 font-medium">Due</th>
                        <th className="py-1.5 pr-4 font-medium">Amount</th>
                        <th className="py-1.5 pr-4 font-medium">Paid</th>
                        <th className="py-1.5 pr-4 font-medium">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balance.installments.map((inst) => (
                        <tr key={inst.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4 text-body text-text-primary">{inst.label}</td>
                          <td className="py-2 pr-4 font-mono text-caption text-text-secondary">{inst.due_date}</td>
                          <td className="py-2 pr-4 font-mono text-body">{inst.amount.toFixed(2)}</td>
                          <td className="py-2 pr-4 font-mono text-body text-success">{inst.paid.toFixed(2)}</td>
                          <td className="py-2 pr-4 font-mono text-body text-danger">{inst.outstanding.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {payments.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-caption font-medium text-text-secondary">Payment History</p>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border text-caption text-text-secondary">
                            <th className="py-1.5 pr-4 font-medium">Date</th>
                            <th className="py-1.5 pr-4 font-medium">Amount</th>
                            <th className="py-1.5 pr-4 font-medium">Method</th>
                            <th className="py-1.5 pr-4 font-medium">Reference</th>
                            <th className="py-1.5 pr-4 font-medium text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.id} className="border-b border-border last:border-0">
                              <td className="py-2 pr-4 font-mono text-caption text-text-secondary">
                                {p.payment_date}
                              </td>
                              <td className="py-2 pr-4 font-mono text-body text-text-primary">
                                {parseFloat(p.amount).toFixed(2)}
                              </td>
                              <td className="py-2 pr-4 text-body capitalize text-text-secondary">
                                {p.method.replace('_', ' ')}
                              </td>
                              <td className="py-2 pr-4 font-mono text-caption text-text-secondary">
                                {p.reference_number ?? '—'}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                <button
                                  onClick={() => handleDownloadReceipt(p.id)}
                                  disabled={downloadingReceiptId === p.id}
                                  className="flex items-center gap-1 text-caption text-accent hover:underline disabled:opacity-50"
                                >
                                  <Download size={12} />
                                  {downloadingReceiptId === p.id ? 'Downloading…' : 'Download'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-3">
                    {!showPaymentForm ? (
                      <Button onClick={() => setShowPaymentForm(true)} className="flex items-center gap-1.5">
                        <Plus size={14} /> Record Payment
                      </Button>
                    ) : (
                      <form
                        onSubmit={handleRecordPayment}
                        className="grid grid-cols-1 gap-3 rounded-button bg-canvas p-3 sm:grid-cols-4"
                      >
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Installment (optional)</label>
                          <select
                            value={paymentForm.fee_installment_id}
                            onChange={(e) => setPaymentForm({ ...paymentForm, fee_installment_id: e.target.value })}
                            className="w-full rounded-button border border-border px-2 py-1.5 text-body"
                          >
                            <option value="">General payment</option>
                            {balance.installments.map((inst) => (
                              <option key={inst.id} value={inst.id}>
                                {inst.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Amount</label>
                          <input
                            required
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            className="w-full rounded-button border border-border px-2 py-1.5 font-mono text-body"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Date</label>
                          <input
                            required
                            type="date"
                            value={paymentForm.payment_date}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                            className="w-full rounded-button border border-border px-2 py-1.5 text-body"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-caption text-text-secondary">Method</label>
                          <select
                            value={paymentForm.method}
                            onChange={(e) =>
                              setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })
                            }
                            className="w-full rounded-button border border-border px-2 py-1.5 text-body"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="sm:col-span-4 flex items-center gap-2">
                          <Button type="submit" disabled={recordingPayment} className="flex items-center gap-1.5">
                            <Download size={14} />
                            {recordingPayment ? 'Recording…' : 'Record & Download Receipt'}
                          </Button>
                          <Button variant="secondary" onClick={() => setShowPaymentForm(false)} disabled={recordingPayment}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Report Card" className="lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Academic Year</label>
                <select
                  value={reportCardYearId}
                  onChange={(e) => {
                    setReportCardYearId(e.target.value);
                    setReportCardData(null);
                  }}
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
                  value={reportCardExamName}
                  onChange={(e) => {
                    setReportCardExamName(e.target.value);
                    setReportCardData(null);
                  }}
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
              <Button variant="secondary" disabled={!reportCardYearId} onClick={handleViewReportCard}>
                View
              </Button>
              <Button
                disabled={!reportCardYearId || downloadingReportCard}
                onClick={handleDownloadReportCard}
                className="flex items-center gap-1.5"
              >
                <Download size={14} />
                {downloadingReportCard ? 'Downloading…' : 'Download PDF'}
              </Button>
            </div>

            {reportCardData && (
              <div className="rounded-card border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <FileCheck2 size={16} className="text-accent" />
                  <span className="font-medium text-text-primary">{reportCardData.academicYearLabel}</span>
                  {reportCardData.attendancePercentage != null && (
                    <Badge tone="info">Attendance: {reportCardData.attendancePercentage.toFixed(1)}%</Badge>
                  )}
                </div>

                {reportCardData.rows.length === 0 ? (
                  <p className="text-body text-text-secondary">No exam results recorded for this year yet.</p>
                ) : (
                  <>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-caption text-text-secondary">
                          <th className="py-1.5 pr-4 font-medium">Subject</th>
                          <th className="py-1.5 pr-4 font-medium">Exam</th>
                          <th className="py-1.5 pr-4 font-medium">Max</th>
                          <th className="py-1.5 pr-4 font-medium">Obtained</th>
                          <th className="py-1.5 pr-4 font-medium">%</th>
                          <th className="py-1.5 pr-4 font-medium">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportCardData.rows.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 text-body text-text-primary">{row.subject}</td>
                            <td className="py-2 pr-4 text-body text-text-secondary">{row.examName}</td>
                            <td className="py-2 pr-4 font-mono text-body">{row.maxMarks.toFixed(2)}</td>
                            <td className="py-2 pr-4 font-mono text-body">
                              {row.marksObtained != null ? row.marksObtained.toFixed(2) : 'Absent'}
                            </td>
                            <td className="py-2 pr-4 font-mono text-body">
                              {row.percentage != null ? `${row.percentage.toFixed(1)}%` : '—'}
                            </td>
                            <td className="py-2 pr-4">
                              {row.grade ? <Badge tone="success">{row.grade}</Badge> : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 border-t border-border pt-3">
                      <span className="text-body font-medium text-text-primary">
                        Overall: {reportCardData.totalObtained.toFixed(2)} / {reportCardData.totalMax.toFixed(2)} (
                        {reportCardData.overallPercentage.toFixed(1)}%) — Grade {reportCardData.overallGrade}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card title="Recent Attendance" className="lg:col-span-3">
            {attendance.length === 0 ? (
              <p className="text-body text-text-secondary">No attendance records yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attendance.slice(0, 20).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded-button border border-border px-3 py-1.5">
                    <CalendarCheck size={14} className="text-text-secondary" />
                    <span className="font-mono text-caption text-text-secondary">{r.date}</span>
                    <Badge tone={ATTENDANCE_TONE[r.status]}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
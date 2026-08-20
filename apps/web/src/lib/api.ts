import { auth } from './auth';
import {
  AcademicYear,
  Admission,
  AdmissionStage,
  Assignment,
  AssignmentSubmission,
  AssetTag,
  AssetTagStatus,
  AttendanceRecord,
  SchoolDocument,
  DocumentAcknowledgment,
  Certificate,
  AttendanceStatus,
  AudienceScope,
  BloodGroup,
  Book,
  BookCopy,
  BookCopyStatus,
  BookIssue,
  BookReservation,
  BookWithAvailability,
  BookWithCopies,
  Campus,
  Circular,
  CircularPriority,
  CircularReadReceipt,
  ClassElectiveOffering,
  ClinicVisit,
  CreateExamGroupPayload,
  DailyMenu,
  DailyMenuItem,
  DailyMenuWithItems,
  DayOfWeek,
  DietaryRestrictionType,
  DiscussionPost,
  DiscussionThread,
  Driver,
  DriverStatus,
  Exam,
  ExamGroup,
  ExamGroupCreateResult,
  ExamGroupDeleteResult,
  ExamResult,
  FeatureToggle,
  FeeAdjustment,
  FeeAdjustmentType,
  FeeAssignment,
  FeeBalance,
  FeePayment,
  FeeStructure,
  HostelRoom,
  HostelRoomAllocation,
  HostelVisitor,
  HostelMaintenanceRequest,
  HostelAttendanceRecord,
  HostelRoomPreference,
  ImmunizationRecord,
  Item,
  ItemCategory,
  Lecture,
  LectureProgress,
  LearningResource,
  LoginResponse,
  MealAttendanceRecord,
  MealHeadcount,
  MealType,
  MenuItem,
  MedicationAdministration,
  PaymentMethod,
  ProcurementRequest,
  ProcurementRequestStatus,
  ReportCardData,
  ReservationStatus,
  Role,
  RolePermission,
  Route,
  RouteAssignment,
  RouteStop,
  RouteWithStops,
  SchoolClass,
  ScreeningCampaign,
  ScreeningResult,
  ScreeningType,
  StockLevel,
  StockTransaction,
  StockTransactionType,
  Student,
  StudentDietaryRestriction,
  StudentElectiveSelection,
  StudentHealthProfile,
  StudentTransportAssignment,
  StudentTransportOptOut,
  Subject,
  TeacherSubjectSpecialization,
  Tenant,
  TimetableSlot,
  User,
  Vehicle,
  VehicleStatus,
  JobOpening,
  Applicant,
  Employee,
  LeaveRequest,
  StaffAttendanceRecord,
  PerformanceReviewCycle,
  PerformanceReview,
  StaffCertification,
  SuccessionPlan,
  SalaryStructure,
  PayrollRun,
  Payslip,
  PayrollSettings,
  LoanAdvance,
  FullFinalSettlement,
  BehaviorIncident,
  IncidentType,
  IncidentStatus,
  PointsBalance,
  DiaryEntry,
  DiaryEntryScope,
  DiaryEntryCategory,
  CorrectiveAction,
  CounselingReferral,
  CounselingReferralStatus,
  Activity,
  ActivityCategory,
  ActivityRoster,
  Award,
  EventRegistration,
  EventType,
  FixtureResult,
  SchoolEvent,
  AlumniProfile,
  AlumniEvent,
  AlumniEventRegistration,
  Donation,
  DonationPaymentMethod,
  DonationTotal,
  MentorshipMatch,
  MentorshipMatchStatus,
  PlanTier,
  TenantSubscription,
  PaymentMode,
  PaymentRecord,
  PrincipalSummary,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Single-flight guard: if several requests hit a 401 at the same moment (e.g.
// the dashboard's Promise.all firing three fetches at once), only the first
// one should actually call /auth/refresh — the rest wait on that same promise
// instead of each independently racing to refresh (which would invalidate
// each other's new tokens depending on backend refresh-token rotation rules).
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data: LoginResponse = await res.json();
      auth.saveSession(data.access_token, data.refresh_token, data.user);
      return true;
    } catch {
      return false;
    }
  })();

  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = auth.getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: 'no-store', 
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !isRetry && auth.getRefreshToken()) {
    // Access token expired mid-session — try one silent refresh-and-retry
    // before giving up, so a 15-minute token lifetime doesn't force a manual
    // re-login every time (the original gap flagged after Phase 0 sign-off).
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    auth.clearSession();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError(401, 'Session expired — please sign in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : (body?.message?.message ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export const api = {
  /**
   * subdomain is optional — omitting it entirely is the platform-level
   * Super Admin login path (SUPER_ADMIN_LOGIN_SCOPE.md §3). Sending an
   * empty string instead would fail the backend's subdomain regex
   * (@Matches, still checked even though the field is @IsOptional), so
   * this only includes `subdomain` in the request body when it's
   * actually provided.
   */
  login: (subdomain: string | undefined, email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(subdomain ? { subdomain, email, password } : { email, password }),
    }),

  getPlatformAdminPing: () => request<{ ok: boolean; scope: string; message: string }>('/platform-admin/ping'),
  getPlatformTenants: () => request<Tenant[]>('/platform-admin/tenants'),
  getPlatformTenantToggles: (tenantId: string) =>
    request<FeatureToggle[]>(`/platform-admin/tenants/${tenantId}/toggles`),

  getPlatformTenantSubscription: (tenantId: string) =>
    request<TenantSubscription>(`/platform-admin/tenants/${tenantId}/subscription`),
  changePlatformTenantTier: (tenantId: string, planTier: PlanTier) =>
    request<TenantSubscription>(`/platform-admin/tenants/${tenantId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({ plan_tier: planTier }),
    }),
  getPlatformTenantPayments: (tenantId: string) =>
    request<PaymentRecord[]>(`/platform-admin/tenants/${tenantId}/payments`),
  recordPlatformTenantPayment: (
    tenantId: string,
    payload: { payment_mode: PaymentMode; amount: string; payment_date: string; notes?: string },
  ) =>
    request<PaymentRecord>(`/platform-admin/tenants/${tenantId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  voidPlatformTenantPayment: (tenantId: string, paymentId: string) =>
    request<PaymentRecord>(`/platform-admin/tenants/${tenantId}/payments/${paymentId}/void`, {
      method: 'PATCH',
    }),
  cancelPlatformTenantSubscription: (tenantId: string) =>
    request<{ cancelled: boolean }>(`/platform-admin/tenants/${tenantId}/subscription/cancel`, {
      method: 'POST',
    }),

  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  getMyTenant: () => request<{ school_name: string; logo_url: string | null; primary_color: string }>('/tenants/mine'),

  getAcademicYears: (tenantId: string) =>
    request<AcademicYear[]>(`/academic-years?tenantId=${tenantId}`),
  createAcademicYear: (payload: {
    tenant_id: string;
    label: string;
    start_date: string;
    end_date: string;
    is_current?: boolean;
  }) => request<AcademicYear>('/academic-years', { method: 'POST', body: JSON.stringify(payload) }),
  setCurrentAcademicYear: (id: string) =>
    request<AcademicYear>(`/academic-years/${id}/set-current`, { method: 'PATCH' }),

  getCampuses: (tenantId: string) => request<Campus[]>(`/campuses?tenantId=${tenantId}`),
  createCampus: (payload: { tenant_id: string; name: string; address?: string; timezone?: string }) =>
    request<Campus>('/campuses', { method: 'POST', body: JSON.stringify(payload) }),

  getUsers: (tenantId: string) => request<User[]>(`/users?tenantId=${tenantId}`),
  createUser: (payload: {
    tenant_id: string;
    campus_id?: string;
    role_id: string;
    student_id?: string;
    name: string;
    email: string;
    phone?: string;
    password?: string;
  }) => request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: {
    name?: string;
    email?: string;
    phone?: string;
    campus_id?: string;
    role_id?: string;
    status?: 'invited' | 'active' | 'disabled';
  }) => request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getRoles: (tenantId: string) => request<Role[]>(`/roles?tenantId=${tenantId}`),
  getRoleModules: () => request<string[]>('/roles/modules'),
  createRole: (tenantId: string, name: string) =>
    request<Role>('/roles', { method: 'POST', body: JSON.stringify({ tenantId, name }) }),
  updateRolePermissions: (id: string, permissions: RolePermission[]) =>
    request<Role>(`/roles/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    }),

  getStudents: (
    tenantId: string,
    filters?: { campusId?: string; gradeLevel?: string; status?: string; search?: string; schoolClassId?: string },
  ) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.campusId) params.set('campusId', filters.campusId);
    if (filters?.gradeLevel) params.set('gradeLevel', filters.gradeLevel);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    return request<Student[]>(`/students?${params.toString()}`);
  },
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  createStudent: (payload: Omit<Student, 'id' | 'status' | 'admission_number'> & { admission_number?: string }) =>
    request<Student>('/students', { method: 'POST', body: JSON.stringify(payload) }),
  updateStudent: (id: string, payload: Partial<Student>) =>
    request<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  changeStudentStatus: (id: string, status: Student['status']) =>
    request<Student>(`/students/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignStudentClass: (id: string, schoolClassId: string) =>
    request<Student>(`/students/${id}/class`, {
      method: 'PATCH',
      body: JSON.stringify({ school_class_id: schoolClassId }),
    }),
  deleteStudent: (id: string) => request<void>(`/students/${id}`, { method: 'DELETE' }),

  getAdmissions: (tenantId: string, filters?: { campusId?: string; stage?: string; search?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.campusId) params.set('campusId', filters.campusId);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.search) params.set('search', filters.search);
    return request<Admission[]>(`/admissions?${params.toString()}`);
  },
  getAdmission: (id: string) => request<Admission>(`/admissions/${id}`),
  createAdmission: (payload: Omit<Admission, 'id' | 'stage' | 'enrolled_student_id'>) =>
    request<Admission>('/admissions', { method: 'POST', body: JSON.stringify(payload) }),
  changeAdmissionStage: (id: string, stage: AdmissionStage) =>
    request<Admission>(`/admissions/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  enrollAdmission: (id: string, payload: { admission_number: string; section?: string }) =>
    request<{ admission: Admission; student: Student }>(`/admissions/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSubjects: (tenantId: string) => request<Subject[]>(`/subjects?tenantId=${tenantId}`),
  createSubject: (payload: {
    tenant_id: string;
    name: string;
    code: string;
    description?: string;
    is_elective?: boolean;
    elective_group?: string;
  }) =>
    request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(payload) }),

  getTeacherSpecializations: (tenantId: string) =>
    request<TeacherSubjectSpecialization[]>(`/teacher-subject-specializations?tenantId=${tenantId}`),
  assignTeacherSpecialization: (payload: {
    tenant_id: string;
    teacher_id: string;
    subject_id: string;
  }) =>
    request<TeacherSubjectSpecialization>('/teacher-subject-specializations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createClassElectiveOffering: (payload: { tenant_id: string; school_class_id: string; subject_id: string }) =>
    request<ClassElectiveOffering>('/class-elective-offerings', { method: 'POST', body: JSON.stringify(payload) }),
  getClassElectiveOfferings: (schoolClassId: string) =>
    request<ClassElectiveOffering[]>(`/class-elective-offerings?schoolClassId=${schoolClassId}`),
  deleteClassElectiveOffering: (id: string) =>
    request<void>(`/class-elective-offerings/${id}`, { method: 'DELETE' }),

  selectMyElective: (subjectId: string) =>
    request<StudentElectiveSelection>('/student-elective-selections/mine', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId }),
    }),
  getMyElectiveSelections: () =>
    request<StudentElectiveSelection[]>('/student-elective-selections/mine'),

  
  getClasses: (tenantId: string, academicYearId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (academicYearId) params.set('academicYearId', academicYearId);
    return request<SchoolClass[]>(`/classes?${params.toString()}`);
  },
  createClass: (payload: {
    tenant_id: string;
    campus_id: string;
    academic_year_id: string;
    grade_level: string;
    section?: string;
    class_teacher_id?: string;
  }) => request<SchoolClass>('/classes', { method: 'POST', body: JSON.stringify(payload) }),

  getTimetableForClass: (schoolClassId: string) =>
    request<TimetableSlot[]>(`/timetable/by-class/${schoolClassId}`),

  getTimetableForTeacher: (tenantId: string, teacherId: string) =>
    request<TimetableSlot[]>(`/timetable/by-teacher?tenantId=${tenantId}&teacherId=${teacherId}`),

  getTeachersBySubject: (tenantId: string) =>
    request<{ subject_id: string; teacher_id: string }[]>(`/timetable/teachers-by-subject?tenantId=${tenantId}`),
  
  getTeacherOccupancy: (tenantId: string) =>
    request<{ teacher_id: string; day_of_week: DayOfWeek; period_number: number }[]>(
      `/timetable/teacher-occupancy?tenantId=${tenantId}`,
    ),  

  getMyClassSubjects: () =>
    request<{ school_class_id: string; subject_id: string }[]>('/timetable/my-class-subjects'),
  createTimetableSlot: (payload: {
    tenant_id: string;
    school_class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: DayOfWeek;
    period_number: number;
  }) => request<TimetableSlot>('/timetable', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTimetableSlot: (id: string) => request<void>(`/timetable/${id}`, { method: 'DELETE' }),
  generateElectivePeriods: (tenantId: string) =>
    request<{
      created: TimetableSlot[];
      perClass: { school_class_id: string; periods_placed: number; periods_requested: number }[];
    }>('/timetable/generate-electives', { method: 'POST', body: JSON.stringify({ tenant_id: tenantId }) }),

  generateTimetable: (payload: {
    tenant_id: string;
    requirements: { school_class_id: string; subject_id: string; teacher_id: string; periods_per_week: number }[];
    days?: string[];
    periods_per_day?: number;
  }) =>
    request<{
      created: TimetableSlot[];
      unscheduled: {
        requirement: { school_class_id: string; subject_id: string; teacher_id: string; periods_per_week: number };
        periods_placed: number;
        periods_requested: number;
      }[];
    }>('/timetable/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markAttendance: (payload: {
    tenant_id: string;
    school_class_id: string;
    date: string;
    entries: { student_id: string; status: AttendanceStatus; notes?: string }[];
  }) => request<AttendanceRecord[]>('/attendance', { method: 'POST', body: JSON.stringify(payload) }),
  getAttendanceForClassOnDate: (schoolClassId: string, date: string) =>
    request<AttendanceRecord[]>(`/attendance/by-class/${schoolClassId}?date=${date}`),
  getAttendanceForStudent: (studentId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<AttendanceRecord[]>(`/attendance/by-student/${studentId}${qs ? `?${qs}` : ''}`);
  },
  getMyChildAttendance: (studentId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ studentId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request<AttendanceRecord[]>(`/attendance/my-child-attendance?${params.toString()}`);
  },

  getFeeStructures: (tenantId: string, gradeLevel?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (gradeLevel) params.set('gradeLevel', gradeLevel);
    return request<FeeStructure[]>(`/fee-structures?${params.toString()}`);
  },
  getFeeStructure: (id: string) => request<FeeStructure>(`/fee-structures/${id}`),
  createFeeStructure: (payload: {
    tenant_id: string;
    academic_year_id: string;
    grade_level: string;
    name: string;
    components: { name: string; amount: string }[];
    installments: { label: string; due_date: string; amount: string }[];
  }) => request<FeeStructure>('/fee-structures', { method: 'POST', body: JSON.stringify(payload) }),

  assignFee: (studentId: string, feeStructureId: string) =>
    request<FeeAssignment>('/fee-assignments', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, fee_structure_id: feeStructureId }),
    }),
  bulkAssignFee: (schoolClassId: string, feeStructureId: string) =>
    request<{ assigned: number; skipped: number }>('/fee-assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ school_class_id: schoolClassId, fee_structure_id: feeStructureId }),
    }),
  getFeeAssignmentsForStudent: (studentId: string) =>
    request<FeeAssignment[]>(`/fee-assignments/by-student/${studentId}`),
  getFeeBalance: (assignmentId: string) => request<FeeBalance>(`/fee-assignments/${assignmentId}/balance`),

  createFeeAdjustment: (payload: {
    fee_assignment_id: string;
    type: FeeAdjustmentType;
    amount: string;
    reason: string;
  }) => request<FeeAdjustment>('/fee-adjustments', { method: 'POST', body: JSON.stringify(payload) }),
  getFeeAdjustments: (assignmentId: string) =>
    request<FeeAdjustment[]>(`/fee-adjustments/by-assignment/${assignmentId}`),

  createFeePayment: (payload: {
    fee_assignment_id: string;
    fee_installment_id?: string;
    amount: string;
    payment_date: string;
    method: PaymentMethod;
    reference_number?: string;
    notes?: string;
  }) => request<FeePayment>('/fee-payments', { method: 'POST', body: JSON.stringify(payload) }),
  getFeePayments: (assignmentId: string) => request<FeePayment[]>(`/fee-payments/by-assignment/${assignmentId}`),

  // Self-service (Parent + Teacher only, gated server-side)
  getMyAccessFeeAssignments: (studentId: string) =>
    request<FeeAssignment[]>(`/fee-assignments/my-access/by-student/${studentId}`),
  getMyAccessFeeBalance: (assignmentId: string) =>
    request<FeeBalance>(`/fee-assignments/my-access/balance/${assignmentId}`),
  setTransportPreference: (studentId: string, wantsTransport: boolean) =>
    request<FeeAssignment>(`/fee-assignments/my-access/transport-preference/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ wantsTransport }),
    }),
  getMyAccessFeePayments: (assignmentId: string) =>
    request<FeePayment[]>(`/fee-payments/my-access/by-assignment/${assignmentId}`),
  async downloadMyAccessFeeReceipt(paymentId: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/fee-payments/my-access/receipt/${paymentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to generate receipt');
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/pdf')) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, `Server did not return a PDF (got ${contentType}): ${body.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${paymentId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Receipt PDFs are binary, not JSON — bypasses the shared `request()`
   * helper (which always parses JSON) and triggers a browser download
   * directly instead of returning data to render.
   */
  async downloadFeeReceipt(paymentId: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/fee-payments/${paymentId}/receipt`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to generate receipt');
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/pdf')) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, `Server did not return a PDF (got ${contentType}): ${body.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${paymentId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  getCirculars: (tenantId: string) => request<Circular[]>(`/circulars?tenantId=${tenantId}`),
  getCircular: (id: string) => request<Circular>(`/circulars/${id}`),
  createCircular: (payload: {
    tenant_id: string;
    title: string;
    body: string;
    priority?: CircularPriority;
    audience_scope: AudienceScope;
    audience_grade_level?: string;
    audience_school_class_id?: string;
  }) => request<Circular>('/circulars', { method: 'POST', body: JSON.stringify(payload) }),
  markCircularRead: (id: string) => request<void>(`/circulars/${id}/read`, { method: 'POST' }),
  getMyCirculars: (studentId?: string) => {
    const qs = studentId ? `?studentId=${studentId}` : '';
    return request<Circular[]>(`/circulars/my-circulars${qs}`);
  },
  markMyCircularRead: (id: string, studentId?: string) => {
    const qs = studentId ? `?studentId=${studentId}` : '';
    return request<void>(`/circulars/my-circulars/${id}/read${qs}`, { method: 'POST' });
  },
  getCircularReadReceipts: (id: string) =>
    request<CircularReadReceipt[]>(`/circulars/${id}/read-receipts`),
  deleteCircular: (id: string) => request<void>(`/circulars/${id}`, { method: 'DELETE' }),

  getExams: (tenantId: string, filters?: { schoolClassId?: string; subjectId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    return request<Exam[]>(`/exams?${params.toString()}`);
  },
  
  createExam: (payload: {
    tenant_id: string;
    subject_id: string;
    school_class_id: string;
    academic_year_id: string;
    name: string;
    exam_date: string;
    max_marks: string;
  }) => request<Exam>('/exams', { method: 'POST', body: JSON.stringify(payload) }),
  enterMarks: (examId: string, entries: { student_id: string; marks_obtained?: string }[]) =>
    request<ExamResult[]>('/exams/marks', {
      method: 'POST',
      body: JSON.stringify({ exam_id: examId, entries }),
    }),
  getExamResults: (examId: string) => request<ExamResult[]>(`/exams/${examId}/results`),

  // --- Exam Groups (bulk exam scheduling) ---
  getExamGroups: (tenantId: string) => request<ExamGroup[]>(`/exam-groups?tenantId=${tenantId}`),
  getExamGroup: (id: string) => request<ExamGroup>(`/exam-groups/${id}`),
  createExamGroup: (payload: CreateExamGroupPayload) =>
    request<ExamGroupCreateResult>('/exam-groups', { method: 'POST', body: JSON.stringify(payload) }),
  updateExamGroupCascade: (
    id: string,
    payload: { name?: string; cascade_date?: string; cascade_max_marks?: number },
  ) =>
    request<{
      group: ExamGroup;
      updated: Exam[];
      skipped: { exam_id: string; school_class_id: string; reason: string }[];
    }>(`/exam-groups/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteExamGroup: (id: string) =>
    request<ExamGroupDeleteResult>(`/exam-groups/${id}`, { method: 'DELETE' }),

  // --- Assignments (LMS) ---
  getAssignments: (tenantId: string, filters?: { schoolClassId?: string; subjectId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    return request<Assignment[]>(`/assignments?${params.toString()}`);
  },
  createAssignment: (payload: {
    tenant_id: string;
    subject_id: string;
    school_class_id: string;
    academic_year_id: string;
    title: string;
    instructions?: string;
    due_date: string;
    max_score: number;
  }) => request<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAssignment: (id: string) => request<{ deleted: boolean }>(`/assignments/${id}`, { method: 'DELETE' }),

  /** Self-service — assignments for the logged-in student's own class only. */
  getMyAssignments: () => request<Assignment[]>('/assignments/mine'),

  /**
   * File upload — bypasses the shared request() helper (always JSON) same
   * as the PDF download methods bypass it for the reverse reason. Browser
   * sets the multipart boundary automatically; never set Content-Type manually here.
   */
  async submitAssignment(assignmentId: string, file: File): Promise<AssignmentSubmission> {
    const token = auth.getAccessToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/assignment-submissions/${assignmentId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string' ? body.message : (body?.message?.message ?? `Request failed (${res.status})`);
      throw new ApiError(res.status, message);
    }
    return res.json();
  },

  /** Self-service — the logged-in student's own submissions, optionally filtered to one assignment. */
  getMySubmissions: (assignmentId?: string) =>
    request<AssignmentSubmission[]>(`/assignment-submissions/mine${assignmentId ? `?assignmentId=${assignmentId}` : ''}`),

  getSubmissionsByAssignment: (assignmentId: string) =>
    request<AssignmentSubmission[]>(`/assignment-submissions/by-assignment/${assignmentId}`),

  gradeSubmission: (id: string, payload: { score: number; feedback?: string }) =>
    request<AssignmentSubmission>(`/assignment-submissions/${id}/grade`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  /** Streams the submitted file back — same download pattern as fee receipts/report cards. */
  async downloadSubmissionFile(submissionId: string, filename: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/assignment-submissions/${submissionId}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to download file');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // --- Learning Resources (LMS) ---
  getResources: (tenantId: string, filters?: { schoolClassId?: string; subjectId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    return request<LearningResource[]>(`/learning-resources?${params.toString()}`);
  },
  getMyResources: () => request<LearningResource[]>('/learning-resources/mine'),
  deleteResource: (id: string) => request<{ deleted: boolean }>(`/learning-resources/${id}`, { method: 'DELETE' }),
  async createResource(payload: {
    tenant_id: string;
    subject_id: string;
    school_class_id: string;
    academic_year_id: string;
    title: string;
    description?: string;
    file: File;
  }): Promise<LearningResource> {
    const token = auth.getAccessToken();
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== 'file') formData.append(key, value as string);
    });
    formData.append('file', payload.file);
    const res = await fetch(`${API_BASE_URL}/learning-resources`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.message?.message ?? body?.message ?? `Request failed (${res.status})`);
    }
    return res.json();
  },
  async downloadResourceFile(id: string, filename: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/learning-resources/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, 'Failed to download file');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // --- Lectures (LMS) ---
  getLectures: (tenantId: string, filters?: { schoolClassId?: string; subjectId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    return request<Lecture[]>(`/lectures?${params.toString()}`);
  },
  getMyLectures: () => request<Lecture[]>('/lectures/mine'),
  getMyLectureProgress: () => request<LectureProgress[]>('/lectures/progress/mine'),
  markLectureWatched: (id: string) => request<LectureProgress>(`/lectures/${id}/watched`, { method: 'POST' }),
  deleteLecture: (id: string) => request<{ deleted: boolean }>(`/lectures/${id}`, { method: 'DELETE' }),
  async createLecture(payload: {
    tenant_id: string;
    subject_id: string;
    school_class_id: string;
    academic_year_id: string;
    title: string;
    description?: string;
    file: File;
  }): Promise<Lecture> {
    const token = auth.getAccessToken();
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== 'file') formData.append(key, value as string);
    });
    formData.append('file', payload.file);
    const res = await fetch(`${API_BASE_URL}/lectures`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.message?.message ?? body?.message ?? `Request failed (${res.status})`);
    }
    return res.json();
  },
  getLectureMediaToken: (id: string) => request<{ token: string }>(`/lectures/${id}/media-token`),
  async getLectureStreamUrl(id: string): Promise<string> {
    const { token } = await this.getLectureMediaToken(id);
    return `${API_BASE_URL}/lectures/${id}/file?token=${encodeURIComponent(token)}`;
  },

  // --- Discussions (LMS) ---
  getDiscussionThreads: (tenantId: string, filters?: { schoolClassId?: string; subjectId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.schoolClassId) params.set('schoolClassId', filters.schoolClassId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    return request<DiscussionThread[]>(`/discussion-threads?${params.toString()}`);
  },
  getMyDiscussionThreads: () => request<DiscussionThread[]>('/discussion-threads/mine'),
  createDiscussionThread: (payload: {
    tenant_id: string;
    subject_id: string;
    school_class_id: string;
    academic_year_id: string;
    title: string;
  }) => request<DiscussionThread>('/discussion-threads', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDiscussionThread: (id: string) =>
    request<{ deleted: boolean }>(`/discussion-threads/${id}`, { method: 'DELETE' }),
  getDiscussionPosts: (threadId: string) => request<DiscussionPost[]>(`/discussion-threads/${threadId}/posts`),
  createDiscussionPost: (threadId: string, content: string) =>
    request<DiscussionPost>(`/discussion-threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getReportCardData: (studentId: string, academicYearId: string, examName?: string) => {
    const params = new URLSearchParams({ academicYearId });
    if (examName) params.set('examName', examName);
    return request<ReportCardData>(`/report-cards/by-student/${studentId}?${params.toString()}`);
  },

  /** Real PDF — same download pattern as fee receipts. */
  async downloadReportCard(studentId: string, academicYearId: string, examName?: string): Promise<void> {
    const token = auth.getAccessToken();
    const params = new URLSearchParams({ academicYearId });
    if (examName) params.set('examName', examName);
    const res = await fetch(
      `${API_BASE_URL}/report-cards/by-student/${studentId}/pdf?${params.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to generate report card');
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/pdf')) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, `Server did not return a PDF (got ${contentType}): ${body.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-card-${studentId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
  /**
   * Self-service — the logged-in Student's own exam results, OR (with
   * studentId supplied) a Parent's linked child's results. studentId is
   * IGNORED server-side for a Student caller — their own results always
   * win regardless of what's passed here — and REQUIRED server-side for a
   * Parent caller (see ExamsController.findMyResults's doc comment on the
   * backend). This client method just passes it through when present.
   */
  getMyExamResults: (academicYearId?: string, studentId?: string, examName?: string) => {
    const params = new URLSearchParams();
    if (academicYearId) params.set('academicYearId', academicYearId);
    if (studentId) params.set('studentId', studentId);
    if (examName) params.set('examName', examName);
    const qs = params.toString();
    return request<Array<ExamResult & { exam: Exam }>>(`/exams/my-results${qs ? `?${qs}` : ''}`);
  },

  /**
   * Self-service — the logged-in Parent's own linked children (see
   * ParentStudentLinksController.findMine on the backend). Lightweight
   * inline type here rather than a formal addition to lib/types.ts, since
   * this is a simple, self-contained shape — worth moving there later for
   * consistency with every other resource if this grows more call sites.
   */
  getMyLinkedStudents: () => request<{ id: string; tenant_id: string; parent_user_id: string; student_id: string; created_at: string }[]>('/parent-student-links/mine'),

  // --- Library (Blueprint Part 2, Module 12) ---
  getBooks: (tenantId: string, filters?: { title?: string; author?: string; category?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.title) params.set('title', filters.title);
    if (filters?.author) params.set('author', filters.author);
    if (filters?.category) params.set('category', filters.category);
    return request<BookWithAvailability[]>(`/library/books?${params.toString()}`);
  },
  getBook: (id: string) => request<BookWithCopies>(`/library/books/${id}`),
  createBook: (payload: {
    tenant_id: string;
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    publisher?: string;
    edition?: string;
    cover_url?: string;
    description?: string;
  }) => request<Book>('/library/books', { method: 'POST', body: JSON.stringify(payload) }),
  updateBook: (id: string, payload: Partial<Omit<Book, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) =>
    request<Book>(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteBook: (id: string) => request<void>(`/library/books/${id}`, { method: 'DELETE' }),

  addBookCopy: (bookId: string, payload: { tenant_id: string; book_id: string; campus_id: string; barcode: string }) =>
    request<BookCopy>(`/library/books/${bookId}/copies`, { method: 'POST', body: JSON.stringify(payload) }),
  getBookCopies: (bookId: string) => request<BookCopy[]>(`/library/books/${bookId}/copies`),
  updateBookCopyStatus: (copyId: string, status: BookCopyStatus) =>
    request<BookCopy>(`/library/books/copies/${copyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  issueBook: (payload: {
    tenant_id: string;
    student_id: string;
    due_date: string;
    barcode?: string;
    book_id?: string;
  }) => request<BookIssue>('/library/issues', { method: 'POST', body: JSON.stringify(payload) }),
  returnBook: (payload: { barcode: string; fine_paid?: boolean }) =>
    request<BookIssue>('/library/issues/return', { method: 'POST', body: JSON.stringify(payload) }),
  getBookIssues: (tenantId: string, filters?: { studentId?: string; overdueOnly?: boolean }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.studentId) params.set('studentId', filters.studentId);
    if (filters?.overdueOnly) params.set('overdueOnly', 'true');
    return request<BookIssue[]>(`/library/issues?${params.toString()}`);
  },

  createReservation: (payload: { tenant_id: string; book_id: string; student_id: string }) =>
    request<BookReservation>('/library/reservations', { method: 'POST', body: JSON.stringify(payload) }),
  getReservations: (tenantId: string, filters?: { bookId?: string; status?: ReservationStatus }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.bookId) params.set('bookId', filters.bookId);
    if (filters?.status) params.set('status', filters.status);
    return request<BookReservation[]>(`/library/reservations?${params.toString()}`);
  },
  cancelReservation: (id: string) =>
    request<BookReservation>(`/library/reservations/${id}/cancel`, { method: 'POST' }),

  // --- Transportation (Blueprint Part 2, Module 13) ---
  getVehicles: (tenantId: string) => request<Vehicle[]>(`/transportation/vehicles?tenantId=${tenantId}`),
  getVehicle: (id: string) => request<Vehicle>(`/transportation/vehicles/${id}`),
  createVehicle: (payload: {
    tenant_id: string;
    campus_id: string;
    registration_number: string;
    model?: string;
    capacity: number;
  }) => request<Vehicle>('/transportation/vehicles', { method: 'POST', body: JSON.stringify(payload) }),
  updateVehicle: (id: string, payload: { model?: string; capacity?: number; status?: VehicleStatus }) =>
    request<Vehicle>(`/transportation/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteVehicle: (id: string) => request<void>(`/transportation/vehicles/${id}`, { method: 'DELETE' }),

  getDrivers: (tenantId: string) => request<Driver[]>(`/transportation/drivers?tenantId=${tenantId}`),
  getDriver: (id: string) => request<Driver>(`/transportation/drivers/${id}`),
  createDriver: (payload: { tenant_id: string; name: string; license_number: string; phone: string }) =>
    request<Driver>('/transportation/drivers', { method: 'POST', body: JSON.stringify(payload) }),
  updateDriver: (
    id: string,
    payload: { name?: string; license_number?: string; phone?: string; status?: DriverStatus },
  ) => request<Driver>(`/transportation/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteDriver: (id: string) => request<void>(`/transportation/drivers/${id}`, { method: 'DELETE' }),

  getRoutes: (tenantId: string) => request<Route[]>(`/transportation/routes?tenantId=${tenantId}`),
  getRoute: (id: string) => request<RouteWithStops>(`/transportation/routes/${id}`),
  createRoute: (payload: { tenant_id: string; name: string; description?: string }) =>
    request<Route>('/transportation/routes', { method: 'POST', body: JSON.stringify(payload) }),
  updateRoute: (id: string, payload: { name?: string; description?: string }) =>
    request<Route>(`/transportation/routes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteRoute: (id: string) => request<void>(`/transportation/routes/${id}`, { method: 'DELETE' }),

  addRouteStop: (
    routeId: string,
    payload: {
      tenant_id: string;
      route_id: string;
      name: string;
      sequence_order: number;
      latitude?: string;
      longitude?: string;
    },
  ) => request<RouteStop>(`/transportation/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(payload) }),
  getRouteStops: (routeId: string) => request<RouteStop[]>(`/transportation/routes/${routeId}/stops`),
  deleteRouteStop: (id: string) => request<void>(`/transportation/stops/${id}`, { method: 'DELETE' }),

  getRouteAssignments: (tenantId: string, academicYearId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (academicYearId) params.set('academicYearId', academicYearId);
    return request<RouteAssignment[]>(`/transportation/route-assignments?${params.toString()}`);
  },
  createRouteAssignment: (payload: {
    tenant_id: string;
    route_id: string;
    vehicle_id: string;
    driver_id: string;
    academic_year_id: string;
  }) => request<RouteAssignment>('/transportation/route-assignments', { method: 'POST', body: JSON.stringify(payload) }),
  deleteRouteAssignment: (id: string) =>
    request<void>(`/transportation/route-assignments/${id}`, { method: 'DELETE' }),

  getStudentTransportAssignments: (tenantId: string, filters?: { routeId?: string; academicYearId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.routeId) params.set('routeId', filters.routeId);
    if (filters?.academicYearId) params.set('academicYearId', filters.academicYearId);
    return request<StudentTransportAssignment[]>(`/transportation/student-assignments?${params.toString()}`);
  },
  createStudentTransportAssignment: (payload: {
    tenant_id: string;
    student_id: string;
    route_id: string;
    stop_id: string;
    academic_year_id: string;
  }) =>
    request<StudentTransportAssignment>('/transportation/student-assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStudentTransportAssignment: (id: string, payload: { route_id?: string; stop_id?: string }) =>
    request<StudentTransportAssignment>(`/transportation/student-assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteStudentTransportAssignment: (id: string) =>
    request<void>(`/transportation/student-assignments/${id}`, { method: 'DELETE' }),
  getMyChildTransportOptOut: (studentId?: string) => {
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId);
    const qs = params.toString();
    return request<StudentTransportOptOut[]>(`/transportation/opt-outs/my-child${qs ? `?${qs}` : ''}`);
  },
  setMyChildTransportOptOut: (payload: { tenant_id: string; student_id: string; academic_year_id: string }) =>
    request<StudentTransportOptOut>('/transportation/opt-outs/my-child', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeMyChildTransportOptOut: (studentId: string, academicYearId: string) =>
    request<void>(`/transportation/opt-outs/my-child/${studentId}?academicYearId=${academicYearId}`, { method: 'DELETE' }),
  getStudentTransportOptOuts: (tenantId: string, academicYearId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (academicYearId) params.set('academicYearId', academicYearId);
    return request<StudentTransportOptOut[]>(`/transportation/opt-outs?${params.toString()}`);
  },

  // --- Health & Wellness (Blueprint Part 2, Module 16) ---
  upsertHealthProfile: (payload: {
    tenant_id: string;
    student_id: string;
    blood_group?: BloodGroup;
    allergies?: string;
    chronic_conditions?: string;
  }) => request<StudentHealthProfile>('/health-wellness/profiles', { method: 'POST', body: JSON.stringify(payload) }),
  getHealthProfiles: (tenantId: string) =>
    request<StudentHealthProfile[]>(`/health-wellness/profiles?tenantId=${tenantId}`),
  getHealthProfileForStudent: (studentId: string, tenantId: string) =>
    request<StudentHealthProfile>(`/health-wellness/profiles/by-student/${studentId}?tenantId=${tenantId}`),

  createImmunizationRecord: (payload: {
    tenant_id: string;
    student_id: string;
    vaccine_name: string;
    date_administered: string;
    notes?: string;
  }) =>
    request<ImmunizationRecord>('/health-wellness/immunizations', { method: 'POST', body: JSON.stringify(payload) }),
  getImmunizationRecords: (tenantId: string) =>
    request<ImmunizationRecord[]>(`/health-wellness/immunizations?tenantId=${tenantId}`),
  getImmunizationRecordsForStudent: (studentId: string, tenantId: string) =>
    request<ImmunizationRecord[]>(`/health-wellness/immunizations/by-student/${studentId}?tenantId=${tenantId}`),
  deleteImmunizationRecord: (id: string) =>
    request<void>(`/health-wellness/immunizations/${id}`, { method: 'DELETE' }),

  createClinicVisit: (payload: {
    tenant_id: string;
    student_id: string;
    visit_date: string;
    reason: string;
    treatment_given?: string;
    follow_up_required?: boolean;
  }) => request<ClinicVisit>('/health-wellness/clinic-visits', { method: 'POST', body: JSON.stringify(payload) }),
  getClinicVisits: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<ClinicVisit[]>(`/health-wellness/clinic-visits?${params.toString()}`);
  },
  updateClinicVisit: (id: string, payload: { treatment_given?: string; follow_up_required?: boolean }) =>
    request<ClinicVisit>(`/health-wellness/clinic-visits/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createMedicationAdministration: (payload: {
    tenant_id: string;
    student_id: string;
    medication_name: string;
    dosage: string;
    administered_at: string;
    consent_confirmed: boolean;
    notes?: string;
  }) =>
    request<MedicationAdministration>('/health-wellness/medications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMedicationAdministrations: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<MedicationAdministration[]>(`/health-wellness/medications?${params.toString()}`);
  },

  createScreeningCampaign: (payload: {
    tenant_id: string;
    name: string;
    screening_type: ScreeningType;
    campaign_date: string;
    description?: string;
  }) =>
    request<ScreeningCampaign>('/health-wellness/screening-campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getScreeningCampaigns: (tenantId: string) =>
    request<ScreeningCampaign[]>(`/health-wellness/screening-campaigns?tenantId=${tenantId}`),
  getScreeningCampaign: (id: string) => request<ScreeningCampaign>(`/health-wellness/screening-campaigns/${id}`),

  createScreeningResult: (payload: {
    tenant_id: string;
    campaign_id: string;
    student_id: string;
    result_summary?: string;
    flagged_for_followup?: boolean;
  }) =>
    request<ScreeningResult>('/health-wellness/screening-results', { method: 'POST', body: JSON.stringify(payload) }),
  getScreeningResultsForCampaign: (campaignId: string, tenantId: string) =>
    request<ScreeningResult[]>(`/health-wellness/screening-campaigns/${campaignId}/results?tenantId=${tenantId}`),
  updateScreeningResult: (id: string, payload: { result_summary?: string; flagged_for_followup?: boolean }) =>
    request<ScreeningResult>(`/health-wellness/screening-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // --- Inventory & Assets (Blueprint Part 2, Module 15) ---
  createItem: (payload: {
    tenant_id: string;
    name: string;
    category: ItemCategory;
    unit: string;
    is_trackable_asset: boolean;
    reorder_point?: number;
    description?: string;
  }) => request<Item>('/inventory-assets/items', { method: 'POST', body: JSON.stringify(payload) }),
  getItems: (tenantId: string, category?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (category) params.set('category', category);
    return request<Item[]>(`/inventory-assets/items?${params.toString()}`);
  },
  getItem: (id: string) => request<Item>(`/inventory-assets/items/${id}`),
  updateItem: (
    id: string,
    payload: { name?: string; category?: ItemCategory; unit?: string; reorder_point?: number; description?: string },
  ) => request<Item>(`/inventory-assets/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteItem: (id: string) => request<void>(`/inventory-assets/items/${id}`, { method: 'DELETE' }),

  recordStockTransaction: (payload: {
    tenant_id: string;
    item_id: string;
    campus_id: string;
    transaction_type: StockTransactionType;
    quantity: number;
    transaction_date: string;
    notes?: string;
  }) =>
    request<StockTransaction>('/inventory-assets/stock/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStock: (tenantId: string, campusId: string) =>
    request<StockLevel[]>(`/inventory-assets/stock?${new URLSearchParams({ tenantId, campusId }).toString()}`),
  getStockTransactionsForItem: (itemId: string, campusId?: string) =>
    request<StockTransaction[]>(
      `/inventory-assets/stock/transactions/by-item/${itemId}${campusId ? `?campusId=${campusId}` : ''}`,
    ),

  createAssetTag: (payload: {
    tenant_id: string;
    item_id: string;
    campus_id: string;
    asset_tag_number: string;
    assigned_location?: string;
    purchase_date?: string;
    purchase_cost?: string;
  }) => request<AssetTag>('/inventory-assets/asset-tags', { method: 'POST', body: JSON.stringify(payload) }),
  getAssetTags: (tenantId: string, itemId?: string, status?: AssetTagStatus) => {
    const params = new URLSearchParams({ tenantId });
    if (itemId) params.set('itemId', itemId);
    if (status) params.set('status', status);
    return request<AssetTag[]>(`/inventory-assets/asset-tags?${params.toString()}`);
  },
  updateAssetTag: (id: string, payload: { status?: AssetTagStatus; assigned_location?: string }) =>
    request<AssetTag>(`/inventory-assets/asset-tags/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createProcurementRequest: (payload: {
    tenant_id: string;
    item_id: string;
    campus_id: string;
    quantity_requested: number;
    requested_date: string;
    notes?: string;
  }) =>
    request<ProcurementRequest>('/inventory-assets/procurement-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getProcurementRequests: (tenantId: string, status?: ProcurementRequestStatus) => {
    const params = new URLSearchParams({ tenantId });
    if (status) params.set('status', status);
    return request<ProcurementRequest[]>(`/inventory-assets/procurement-requests?${params.toString()}`);
  },
  updateProcurementRequestStatus: (id: string, payload: { status: ProcurementRequestStatus; notes?: string }) =>
    request<ProcurementRequest>(`/inventory-assets/procurement-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // --- Cafeteria & Meal Management (Blueprint Part 2, Module 22) ---
  createMenuItem: (payload: { tenant_id: string; name: string; description?: string; dietary_tags?: string }) =>
    request<MenuItem>('/cafeteria/menu-items', { method: 'POST', body: JSON.stringify(payload) }),
  getMenuItems: (tenantId: string) => request<MenuItem[]>(`/cafeteria/menu-items?tenantId=${tenantId}`),
  updateMenuItem: (id: string, payload: { name?: string; description?: string; dietary_tags?: string }) =>
    request<MenuItem>(`/cafeteria/menu-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteMenuItem: (id: string) => request<void>(`/cafeteria/menu-items/${id}`, { method: 'DELETE' }),

  createDailyMenu: (payload: { tenant_id: string; menu_date: string; meal_type: MealType }) =>
    request<DailyMenu>('/cafeteria/daily-menus', { method: 'POST', body: JSON.stringify(payload) }),
  getDailyMenus: (tenantId: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return request<DailyMenu[]>(`/cafeteria/daily-menus?${params.toString()}`);
  },
  getDailyMenu: (id: string) => request<DailyMenuWithItems>(`/cafeteria/daily-menus/${id}`),
  deleteDailyMenu: (id: string) => request<void>(`/cafeteria/daily-menus/${id}`, { method: 'DELETE' }),
  addMenuItemToDailyMenu: (dailyMenuId: string, payload: { tenant_id: string; menu_item_id: string }) =>
    request<DailyMenuItem>(`/cafeteria/daily-menus/${dailyMenuId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeDailyMenuItem: (id: string) => request<void>(`/cafeteria/daily-menu-items/${id}`, { method: 'DELETE' }),

  recordMealAttendance: (payload: {
    tenant_id: string;
    attendance_date: string;
    meal_type: MealType;
    student_ids: string[];
  }) => request<MealAttendanceRecord[]>('/cafeteria/meal-attendance', { method: 'POST', body: JSON.stringify(payload) }),
  getMealAttendance: (tenantId: string, date: string, mealType?: MealType) => {
    const params = new URLSearchParams({ tenantId, date });
    if (mealType) params.set('mealType', mealType);
    return request<MealAttendanceRecord[]>(`/cafeteria/meal-attendance?${params.toString()}`);
  },
  getMealHeadcounts: (tenantId: string, dateFrom: string, dateTo: string) =>
    request<MealHeadcount[]>(
      `/cafeteria/meal-attendance/headcounts?${new URLSearchParams({ tenantId, dateFrom, dateTo }).toString()}`,
    ),

  createDietaryRestriction: (payload: {
    tenant_id: string;
    student_id: string;
    restriction_type: DietaryRestrictionType;
    details: string;
  }) =>
    request<StudentDietaryRestriction>('/cafeteria/dietary-restrictions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDietaryRestrictions: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<StudentDietaryRestriction[]>(`/cafeteria/dietary-restrictions?${params.toString()}`);
  },
  updateDietaryRestriction: (id: string, payload: { restriction_type?: DietaryRestrictionType; details?: string }) =>
    request<StudentDietaryRestriction>(`/cafeteria/dietary-restrictions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteDietaryRestriction: (id: string) =>
    request<void>(`/cafeteria/dietary-restrictions/${id}`, { method: 'DELETE' }),

  // --- Feature Toggles (per-tenant operational config) ---
  getFeatureToggles: () => request<FeatureToggle[]>('/feature-toggles'),
  setFeatureToggle: (featureKey: string, enabled: boolean) =>
    request<FeatureToggle>(`/feature-toggles/${featureKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  // --- Hostel Management (Blueprint Part 2, Module 14) ---
  createHostelRoom: (payload: { tenant_id: string; campus_id: string; building_name: string; room_number: string; floor?: number; capacity: number; room_type?: HostelRoom['room_type'] }) =>
    request<HostelRoom>('/hostel/rooms', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelRooms: (tenantId: string, campusId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (campusId) params.set('campusId', campusId);
    return request<HostelRoom[]>(`/hostel/rooms?${params.toString()}`);
  },
  updateHostelRoom: (id: string, payload: Partial<Pick<HostelRoom, 'building_name' | 'room_number' | 'floor' | 'capacity' | 'room_type'>>) =>
    request<HostelRoom>(`/hostel/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteHostelRoom: (id: string) => request<void>(`/hostel/rooms/${id}`, { method: 'DELETE' }),

  createHostelAllocation: (payload: { tenant_id: string; room_id: string; student_id: string; academic_year_id: string; allocated_date: string }) =>
    request<HostelRoomAllocation>('/hostel/room-allocations', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelAllocations: (tenantId: string, filters?: { roomId?: string; studentId?: string; status?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.roomId) params.set('roomId', filters.roomId);
    if (filters?.studentId) params.set('studentId', filters.studentId);
    if (filters?.status) params.set('status', filters.status);
    return request<HostelRoomAllocation[]>(`/hostel/room-allocations?${params.toString()}`);
  },
  vacateHostelAllocation: (id: string, vacatedDate: string) =>
    request<HostelRoomAllocation>(`/hostel/room-allocations/${id}/vacate`, { method: 'PATCH', body: JSON.stringify({ vacated_date: vacatedDate }) }),

  createHostelVisitor: (payload: { tenant_id: string; student_id: string; visitor_name: string; relation: string; purpose?: string; id_proof_type?: string; id_proof_number?: string; check_in_time: string }) =>
    request<HostelVisitor>('/hostel/visitors', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelVisitors: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<HostelVisitor[]>(`/hostel/visitors?${params.toString()}`);
  },
  checkOutHostelVisitor: (id: string, checkOutTime: string) =>
    request<HostelVisitor>(`/hostel/visitors/${id}/check-out`, { method: 'PATCH', body: JSON.stringify({ check_out_time: checkOutTime }) }),
  verifyHostelVisitor: (id: string) =>
    request<HostelVisitor>(`/hostel/visitors/${id}/verify`, { method: 'PATCH' }),

  createHostelMaintenanceRequest: (payload: { tenant_id: string; room_id: string; description: string; reported_by: string; reported_date: string }) =>
    request<HostelMaintenanceRequest>('/hostel/maintenance-requests', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelMaintenanceRequests: (tenantId: string, status?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (status) params.set('status', status);
    return request<HostelMaintenanceRequest[]>(`/hostel/maintenance-requests?${params.toString()}`);
  },
  updateHostelMaintenanceStatus: (id: string, status: HostelMaintenanceRequest['status'], resolvedDate?: string) =>
    request<HostelMaintenanceRequest>(`/hostel/maintenance-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolved_date: resolvedDate }) }),

  recordHostelAttendance: (payload: { tenant_id: string; date: string; entries: { student_id: string; status: HostelAttendanceRecord['status']; curfew_check_in_time?: string }[] }) =>
    request<HostelAttendanceRecord[]>('/hostel/attendance', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelAttendanceForDate: (tenantId: string, date: string) =>
    request<HostelAttendanceRecord[]>(`/hostel/attendance/by-date?tenantId=${tenantId}&date=${date}`),
  getHostelAttendanceForStudent: (studentId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<HostelAttendanceRecord[]>(`/hostel/attendance/by-student/${studentId}${qs ? `?${qs}` : ''}`);
  },

  createHostelRoomPreference: (payload: { tenant_id: string; student_id: string; preferred_roommate_id?: string; preferred_floor?: number; notes?: string }) =>
    request<HostelRoomPreference>('/hostel/room-preferences', { method: 'POST', body: JSON.stringify(payload) }),
  getHostelRoomPreferences: (tenantId: string) => request<HostelRoomPreference[]>(`/hostel/room-preferences?tenantId=${tenantId}`),
  runHostelRoomMatching: (tenantId: string) =>
    request<{ matched: number; unmatched: number }>('/hostel/room-preferences/match', { method: 'POST', body: JSON.stringify({ tenant_id: tenantId }) }),  

  // --- HR Management (Blueprint Part 2, Module 10) ---
  createJobOpening: (payload: { tenant_id: string; title: string; department: string; description?: string }) =>
    request<JobOpening>('/hr-management/job-openings', { method: 'POST', body: JSON.stringify(payload) }),
  getJobOpenings: (tenantId: string, status?: JobOpening['status']) => {
    const params = new URLSearchParams({ tenantId });
    if (status) params.set('status', status);
    return request<JobOpening[]>(`/hr-management/job-openings?${params.toString()}`);
  },
  updateJobOpeningStatus: (id: string, status: JobOpening['status']) =>
    request<JobOpening>(`/hr-management/job-openings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createApplicant: (payload: { tenant_id: string; job_opening_id: string; name: string; email: string; phone?: string; resume_url?: string }) =>
    request<Applicant>('/hr-management/applicants', { method: 'POST', body: JSON.stringify(payload) }),
  getApplicants: (tenantId: string, jobOpeningId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (jobOpeningId) params.set('jobOpeningId', jobOpeningId);
    return request<Applicant[]>(`/hr-management/applicants?${params.toString()}`);
  },
  updateApplicantStage: (id: string, stage: Applicant['stage']) =>
    request<Applicant>(`/hr-management/applicants/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  hireApplicant: (id: string, payload: { department: string; designation: string; employment_type?: Employee['employment_type']; date_of_joining: string; manager_id?: string; base_salary?: string }) =>
    request<{ applicant: Applicant; employee: Employee }>(`/hr-management/applicants/${id}/hire`, { method: 'POST', body: JSON.stringify(payload) }),

  createEmployee: (payload: { tenant_id: string; user_id?: string; manager_id?: string; name: string; email: string; department: string; designation: string; employment_type?: Employee['employment_type']; date_of_joining: string; contract_end_date?: string; base_salary?: string }) =>
    request<Employee>('/hr-management/employees', { method: 'POST', body: JSON.stringify(payload) }),
  getEmployees: (tenantId: string, department?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (department) params.set('department', department);
    return request<Employee[]>(`/hr-management/employees?${params.toString()}`);
  },
  getOrgChart: (tenantId: string) => request<Employee[]>(`/hr-management/employees/org-chart?tenantId=${tenantId}`),
  getMyEmployeeRecord: () => request<Employee | null>('/hr-management/employees/mine'),
  updateEmployee: (id: string, payload: Partial<Pick<Employee, 'manager_id' | 'department' | 'designation' | 'employment_type' | 'status' | 'contract_end_date' | 'base_salary'>>) =>
    request<Employee>(`/hr-management/employees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createLeaveRequest: (payload: { tenant_id: string; employee_id: string; leave_type: LeaveRequest['leave_type']; from_date: string; to_date: string; reason?: string }) =>
    request<LeaveRequest>('/hr-management/leave-requests', { method: 'POST', body: JSON.stringify(payload) }),
  getLeaveRequests: (tenantId: string, filters?: { employeeId?: string; status?: LeaveRequest['status'] }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.employeeId) params.set('employeeId', filters.employeeId);
    if (filters?.status) params.set('status', filters.status);
    return request<LeaveRequest[]>(`/hr-management/leave-requests?${params.toString()}`);
  },
  getMyLeaveRequests: () => request<LeaveRequest[]>('/hr-management/leave-requests/mine'),
  approveLeaveRequest: (id: string) => request<LeaveRequest>(`/hr-management/leave-requests/${id}/approve`, { method: 'PATCH' }),
  rejectLeaveRequest: (id: string) => request<LeaveRequest>(`/hr-management/leave-requests/${id}/reject`, { method: 'PATCH' }),

  recordStaffAttendance: (payload: { tenant_id: string; date: string; entries: { employee_id: string; status: StaffAttendanceRecord['status'] }[] }) =>
    request<StaffAttendanceRecord[]>('/hr-management/attendance', { method: 'POST', body: JSON.stringify(payload) }),
  getStaffAttendanceForDate: (tenantId: string, date: string) =>
    request<StaffAttendanceRecord[]>(`/hr-management/attendance/by-date?tenantId=${tenantId}&date=${date}`),
  getStaffAttendanceForEmployee: (employeeId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<StaffAttendanceRecord[]>(`/hr-management/attendance/by-employee/${employeeId}${qs ? `?${qs}` : ''}`);
  },

  createReviewCycle: (payload: { tenant_id: string; cycle_name: string; start_date: string; end_date: string }) =>
    request<PerformanceReviewCycle>('/hr-management/review-cycles', { method: 'POST', body: JSON.stringify(payload) }),
  getReviewCycles: (tenantId: string) => request<PerformanceReviewCycle[]>(`/hr-management/review-cycles?tenantId=${tenantId}`),
  startCalibration: (id: string) => request<PerformanceReviewCycle>(`/hr-management/review-cycles/${id}/start-calibration`, { method: 'PATCH' }),
  closeReviewCycle: (id: string) => request<PerformanceReviewCycle>(`/hr-management/review-cycles/${id}/close`, { method: 'PATCH' }),

  createPerformanceReview: (payload: { tenant_id: string; cycle_id: string; employee_id: string; reviewer_id: string; reviewer_type: PerformanceReview['reviewer_type']; rating: number; comments?: string }) =>
    request<PerformanceReview>('/hr-management/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getReviewsForCycle: (cycleId: string) => request<PerformanceReview[]>(`/hr-management/reviews/by-cycle/${cycleId}`),
  getReviewsForEmployee: (employeeId: string) => request<PerformanceReview[]>(`/hr-management/reviews/by-employee/${employeeId}`),
  getMyReviews: () => request<PerformanceReview[]>('/hr-management/reviews/mine'),
  calibrateReview: (id: string, calibratedRating: number) =>
    request<PerformanceReview>(`/hr-management/reviews/${id}/calibrate`, { method: 'PATCH', body: JSON.stringify({ calibrated_rating: calibratedRating }) }),

  createCertification: (payload: { tenant_id: string; employee_id: string; certification_name: string; issued_date: string; expiry_date?: string }) =>
    request<StaffCertification>('/hr-management/certifications', { method: 'POST', body: JSON.stringify(payload) }),
  getCertifications: (tenantId: string, employeeId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (employeeId) params.set('employeeId', employeeId);
    return request<StaffCertification[]>(`/hr-management/certifications?${params.toString()}`);
  },
  getCertificationsExpiringSoon: (tenantId: string, daysAhead?: number) => {
    const params = new URLSearchParams({ tenantId });
    if (daysAhead) params.set('daysAhead', String(daysAhead));
    return request<StaffCertification[]>(`/hr-management/certifications/expiring-soon?${params.toString()}`);
  },
  updateCertification: (id: string, payload: Partial<Pick<StaffCertification, 'certification_name' | 'issued_date' | 'expiry_date'>>) =>
    request<StaffCertification>(`/hr-management/certifications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCertification: (id: string) => request<void>(`/hr-management/certifications/${id}`, { method: 'DELETE' }),

  createSuccessionPlan: (payload: { tenant_id: string; position_employee_id: string; successor_employee_id?: string; notes?: string }) =>
    request<SuccessionPlan>('/hr-management/succession-plans', { method: 'POST', body: JSON.stringify(payload) }),
  getSuccessionPlans: (tenantId: string) => request<SuccessionPlan[]>(`/hr-management/succession-plans?tenantId=${tenantId}`),
  updateSuccessionPlan: (id: string, payload: Partial<Pick<SuccessionPlan, 'successor_employee_id' | 'readiness_level' | 'notes'>>) =>
    request<SuccessionPlan>(`/hr-management/succession-plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSuccessionPlan: (id: string) => request<void>(`/hr-management/succession-plans/${id}`, { method: 'DELETE' }),

  // --- Payroll (Blueprint Part 2, Module 11) ---
  createSalaryStructure: (payload: { tenant_id: string; employee_id: string; basic_salary: string; hra?: string; special_allowance?: string; other_allowances?: string; effective_from: string; bank_account_number?: string; bank_ifsc_code?: string; bank_account_holder_name?: string }) =>
    request<SalaryStructure>('/payroll/salary-structures', { method: 'POST', body: JSON.stringify(payload) }),
  getSalaryStructuresForEmployee: (employeeId: string) =>
    request<SalaryStructure[]>(`/payroll/salary-structures/by-employee/${employeeId}`),

  getPayrollSettings: (tenantId: string) => request<PayrollSettings>(`/payroll/settings?tenantId=${tenantId}`),
  updatePayrollSettings: (tenantId: string, professionalTaxAmount: string) =>
    request<PayrollSettings>(`/payroll/settings?tenantId=${tenantId}`, { method: 'PATCH', body: JSON.stringify({ professional_tax_amount: professionalTaxAmount }) }),

  createPayrollRun: (payload: { tenant_id: string; month: number; year: number }) =>
    request<PayrollRun>('/payroll/runs', { method: 'POST', body: JSON.stringify(payload) }),
  getPayrollRuns: (tenantId: string) => request<PayrollRun[]>(`/payroll/runs?tenantId=${tenantId}`),
  getPayrollRun: (id: string) => request<PayrollRun>(`/payroll/runs/${id}`),
  processPayrollRun: (id: string, adjustments?: { employee_id: string; bonuses?: string; overtime?: string; reimbursements?: string }[]) =>
    request<{ run: PayrollRun; payslips: Payslip[]; skippedEmployeeIds: string[] }>(`/payroll/runs/${id}/process`, { method: 'POST', body: JSON.stringify({ adjustments }) }),
  markPayrollRunDisbursed: (id: string) => request<PayrollRun>(`/payroll/runs/${id}/mark-disbursed`, { method: 'PATCH' }),
  getPayslipsForRun: (id: string) => request<Payslip[]>(`/payroll/runs/${id}/payslips`),
  getMyPayslips: () => request<Payslip[]>('/payroll/payslips/mine'),

  createLoanAdvance: (payload: { tenant_id: string; employee_id: string; amount: string; monthly_recovery_amount: string }) =>
    request<LoanAdvance>('/payroll/loans', { method: 'POST', body: JSON.stringify(payload) }),
  getLoanAdvances: (tenantId: string, employeeId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (employeeId) params.set('employeeId', employeeId);
    return request<LoanAdvance[]>(`/payroll/loans?${params.toString()}`);
  },
  closeLoanAdvance: (id: string) => request<LoanAdvance>(`/payroll/loans/${id}/close`, { method: 'PATCH' }),

  createSettlement: (payload: { tenant_id: string; employee_id: string; last_working_date: string; dues?: string; deductions?: string }) =>
    request<FullFinalSettlement>('/payroll/settlements', { method: 'POST', body: JSON.stringify(payload) }),
  getSettlements: (tenantId: string) => request<FullFinalSettlement[]>(`/payroll/settlements?tenantId=${tenantId}`),
  processSettlement: (id: string) => request<FullFinalSettlement>(`/payroll/settlements/${id}/process`, { method: 'PATCH' }),

  async downloadPayrollBankFile(runId: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/payroll/runs/${runId}/bank-file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to generate bank file');
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/csv')) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, `Server did not return a CSV (got ${contentType}): ${body.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bank-file-${runId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
  provisionTenant: (payload: { school_name: string; subdomain: string; logo_url?: string; primary_color?: string; first_admin_name: string; first_admin_email: string; first_admin_password: string; disabled_modules?: string[] }) =>
    request<{ tenant: Tenant; admin: User }>('/tenants', { method: 'POST', body: JSON.stringify(payload) }),

  // --- Document Management & Digital Signatures (Module 19) ---

  getDocuments: (tenantId: string, category?: string, studentId?: string, employeeId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (category) params.set('category', category);
    if (studentId) params.set('studentId', studentId);
    if (employeeId) params.set('employeeId', employeeId);
    return request<SchoolDocument[]>(`/documents?${params.toString()}`);
  },

  getDocument: (id: string) => request<SchoolDocument>(`/documents/${id}`),

  async uploadDocument(payload: {
    tenant_id: string;
    category: string;
    title: string;
    description?: string;
    related_student_id?: string;
    related_employee_id?: string;
    file: File;
  }): Promise<SchoolDocument> {
    const token = auth.getAccessToken();
    const formData = new FormData();
    formData.append('tenant_id', payload.tenant_id);
    formData.append('category', payload.category);
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.related_student_id) formData.append('related_student_id', payload.related_student_id);
    if (payload.related_employee_id) formData.append('related_employee_id', payload.related_employee_id);
    formData.append('file', payload.file);
    const res = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string' ? body.message : (body?.message?.message ?? `Request failed (${res.status})`);
      throw new ApiError(res.status, message);
    }
    return res.json();
  },

  updateDocumentApproval: (id: string, approval_status: string) =>
    request<SchoolDocument>(`/documents/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status }),
    }),

  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),

  async downloadDocumentFile(id: string, filename: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/documents/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to download document');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  acknowledgeDocument: (id: string) => request<DocumentAcknowledgment>(`/documents/${id}/acknowledge`, { method: 'POST' }),

  getDocumentAcknowledgments: (id: string) => request<DocumentAcknowledgment[]>(`/documents/${id}/acknowledgments`),

  getCertificates: (tenantId: string, studentId?: string) =>
    request<Certificate[]>(`/documents/certificates?tenantId=${tenantId}${studentId ? `&studentId=${studentId}` : ''}`),

  createCertificate: (payload: { tenant_id: string; student_id: string; certificate_type: string; issued_date: string }) =>
    request<Certificate>('/documents/certificates', { method: 'POST', body: JSON.stringify(payload) }),

  deleteCertificate: (id: string) => request<void>(`/documents/certificates/${id}`, { method: 'DELETE' }),

  async downloadCertificatePdf(id: string): Promise<void> {
    const token = auth.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/documents/certificates/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || 'Failed to generate certificate');
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/pdf')) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, `Server did not return a PDF (got ${contentType}): ${body.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
  // --- Activities, Events & Sports (Blueprint Part 2, Module 21) ---

  getActivities: (tenantId: string) => request<Activity[]>(`/activities?tenantId=${tenantId}`),
  createActivity: (payload: { tenant_id: string; name: string; category: ActivityCategory; description?: string }) =>
    request<Activity>('/activities', { method: 'POST', body: JSON.stringify(payload) }),
  updateActivity: (id: string, payload: { name?: string; category?: ActivityCategory; description?: string }) =>
    request<Activity>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteActivity: (id: string) => request<void>(`/activities/${id}`, { method: 'DELETE' }),

  addToActivityRoster: (activityId: string, payload: { tenant_id: string; student_id: string; joined_date: string }) =>
    request<ActivityRoster>(`/activities/${activityId}/roster`, { method: 'POST', body: JSON.stringify(payload) }),
  getActivityRoster: (activityId: string) => request<ActivityRoster[]>(`/activities/${activityId}/roster`),
  removeFromActivityRoster: (id: string) => request<void>(`/activities/roster/${id}`, { method: 'DELETE' }),

  getEvents: (tenantId: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return request<SchoolEvent[]>(`/activities/events?${params.toString()}`);
  },
  getEvent: (id: string) => request<SchoolEvent>(`/activities/events/${id}`),
  createEvent: (payload: {
    tenant_id: string;
    activity_id?: string;
    name: string;
    event_type: EventType;
    event_date: string;
    location?: string;
    opponent_name?: string;
  }) => request<SchoolEvent>('/activities/events', { method: 'POST', body: JSON.stringify(payload) }),
  deleteEvent: (id: string) => request<void>(`/activities/events/${id}`, { method: 'DELETE' }),
  recordFixtureResult: (id: string, payload: { our_score: number; opponent_score: number; result: FixtureResult }) =>
    request<SchoolEvent>(`/activities/events/${id}/fixture-result`, { method: 'PATCH', body: JSON.stringify(payload) }),

  registerForEvent: (eventId: string, payload: { tenant_id: string; student_id: string }) =>
    request<EventRegistration>(`/activities/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEventRegistrations: (eventId: string) =>
    request<EventRegistration[]>(`/activities/events/${eventId}/registrations`),
  unregisterFromEvent: (id: string) => request<void>(`/activities/registrations/${id}`, { method: 'DELETE' }),

  createAward: (payload: { tenant_id: string; student_id: string; event_id?: string; title: string; awarded_date: string }) =>
    request<Award>('/activities/awards', { method: 'POST', body: JSON.stringify(payload) }),
  getAwards: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<Award[]>(`/activities/awards?${params.toString()}`);
  },
  deleteAward: (id: string) => request<void>(`/activities/awards/${id}`, { method: 'DELETE' }),

  // --- Discipline & Behaviour Management (Blueprint Part 2, Module 20) ---

  getIncidents: (tenantId: string, studentId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (studentId) params.set('studentId', studentId);
    return request<BehaviorIncident[]>(`/discipline/incidents?${params.toString()}`);
  },
  getIncident: (id: string) => request<BehaviorIncident>(`/discipline/incidents/${id}`),
  createIncident: (payload: {
    tenant_id: string;
    student_id: string;
    incident_date: string;
    incident_type: IncidentType;
    points: number;
    description: string;
  }) => request<BehaviorIncident>('/discipline/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncidentStatus: (id: string, status: IncidentStatus) =>
    request<BehaviorIncident>(`/discipline/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteIncident: (id: string) => request<void>(`/discipline/incidents/${id}`, { method: 'DELETE' }),
  getPointsBalance: (studentId: string) =>
    request<PointsBalance>(`/discipline/incidents/points-balance/${studentId}`),
  getMyChildIncidents: (studentId?: string) => {
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId);
    const qs = params.toString();
    return request<BehaviorIncident[]>(`/discipline/incidents/my-child-incidents${qs ? `?${qs}` : ''}`);
  },
  getMyChildPointsBalance: (studentId?: string) => {
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId);
    const qs = params.toString();
    return request<PointsBalance>(`/discipline/incidents/my-child-points-balance${qs ? `?${qs}` : ''}`);
  },

  createCorrectiveAction: (
    incidentId: string,
    payload: { tenant_id: string; description: string; assigned_to: string; due_date: string },
  ) =>
    request<CorrectiveAction>(`/discipline/incidents/${incidentId}/corrective-actions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCorrectiveActions: (incidentId: string) =>
    request<CorrectiveAction[]>(`/discipline/incidents/${incidentId}/corrective-actions`),
  completeCorrectiveAction: (id: string, completed_date: string) =>
    request<CorrectiveAction>(`/discipline/corrective-actions/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed_date }),
    }),
  deleteCorrectiveAction: (id: string) => request<void>(`/discipline/corrective-actions/${id}`, { method: 'DELETE' }),
  getDiaryEntries: (params?: { class_id?: string; student_id?: string; from_date?: string; to_date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.class_id) qs.set('class_id', params.class_id);
    if (params?.student_id) qs.set('student_id', params.student_id);
    if (params?.from_date) qs.set('from_date', params.from_date);
    if (params?.to_date) qs.set('to_date', params.to_date);
    const query = qs.toString();
    return request<DiaryEntry[]>(`/diary-entries${query ? `?${query}` : ''}`);
  },
  createDiaryEntry: (payload: {
    class_id?: string;
    scope: DiaryEntryScope;
    student_id?: string;
    category?: DiaryEntryCategory;
    content: string;
    entry_date?: string;
  }) => request<DiaryEntry>('/diary-entries', { method: 'POST', body: JSON.stringify(payload) }),
  updateDiaryEntry: (id: string, payload: { category?: DiaryEntryCategory; content?: string }) =>
    request<DiaryEntry>(`/diary-entries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteDiaryEntry: (id: string) => request<void>(`/diary-entries/${id}`, { method: 'DELETE' }),
  addDiaryReply: (id: string, content: string) =>
    request<DiaryEntry>(`/diary-entries/${id}/replies`, { method: 'POST', body: JSON.stringify({ content }) }),

  createCounselingReferral: (
    incidentId: string,
    payload: { tenant_id: string; referred_to: string; reason: string; notes?: string },
  ) =>
    request<CounselingReferral>(`/discipline/incidents/${incidentId}/counseling-referrals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCounselingReferrals: (incidentId: string) =>
    request<CounselingReferral[]>(`/discipline/incidents/${incidentId}/counseling-referrals`),
  getMyCaseload: () => request<CounselingReferral[]>('/discipline/counseling-referrals/my-caseload'),
  updateCounselingReferral: (id: string, payload: { status?: CounselingReferralStatus; notes?: string }) =>
    request<CounselingReferral>(`/discipline/counseling-referrals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCounselingReferral: (id: string) =>
    request<void>(`/discipline/counseling-referrals/${id}`, { method: 'DELETE' }),

  // --- Alumni & Advancement (Blueprint Part 2, Module 23) ---

  getAlumniProfiles: (tenantId: string) => request<AlumniProfile[]>(`/alumni/profiles?tenantId=${tenantId}`),
  getAlumniProfile: (id: string) => request<AlumniProfile>(`/alumni/profiles/${id}`),
  createAlumniProfile: (payload: {
    tenant_id: string;
    student_id: string;
    graduation_year: number;
    current_occupation?: string;
    current_employer?: string;
    current_city?: string;
    contact_email?: string;
    contact_phone?: string;
    linkedin_url?: string;
    bio?: string;
  }) => request<AlumniProfile>('/alumni/profiles', { method: 'POST', body: JSON.stringify(payload) }),
  updateAlumniProfile: (
    id: string,
    payload: Partial<{
      current_occupation: string;
      current_employer: string;
      current_city: string;
      contact_email: string;
      contact_phone: string;
      linkedin_url: string;
      bio: string;
    }>,
  ) => request<AlumniProfile>(`/alumni/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAlumniProfile: (id: string) => request<void>(`/alumni/profiles/${id}`, { method: 'DELETE' }),

  getAlumniEvents: (tenantId: string) => request<AlumniEvent[]>(`/alumni/events?tenantId=${tenantId}`),
  createAlumniEvent: (payload: { tenant_id: string; name: string; event_date: string; location?: string; description?: string }) =>
    request<AlumniEvent>('/alumni/events', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAlumniEvent: (id: string) => request<void>(`/alumni/events/${id}`, { method: 'DELETE' }),
  registerForAlumniEvent: (eventId: string, payload: { tenant_id: string; alumni_id: string }) =>
    request<AlumniEventRegistration>(`/alumni/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAlumniEventRegistrations: (eventId: string) =>
    request<AlumniEventRegistration[]>(`/alumni/events/${eventId}/registrations`),

  getDonations: (tenantId: string, alumniId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (alumniId) params.set('alumniId', alumniId);
    return request<Donation[]>(`/alumni/donations?${params.toString()}`);
  },
  createDonation: (payload: {
    tenant_id: string;
    alumni_id: string;
    amount: string;
    donation_date: string;
    purpose?: string;
    payment_method: DonationPaymentMethod;
    notes?: string;
  }) => request<Donation>('/alumni/donations', { method: 'POST', body: JSON.stringify(payload) }),
  getDonationTotal: (alumniId: string) => request<DonationTotal>(`/alumni/donations/total/${alumniId}`),
  deleteDonation: (id: string) => request<void>(`/alumni/donations/${id}`, { method: 'DELETE' }),

  getMentorshipMatches: (tenantId: string) => request<MentorshipMatch[]>(`/alumni/mentorship-matches?tenantId=${tenantId}`),
  createMentorshipMatch: (payload: { tenant_id: string; mentor_alumni_id: string; mentee_student_id: string; notes?: string }) =>
    request<MentorshipMatch>('/alumni/mentorship-matches', { method: 'POST', body: JSON.stringify(payload) }),
  updateMentorshipMatchStatus: (id: string, status: MentorshipMatchStatus) =>
    request<MentorshipMatch>(`/alumni/mentorship-matches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteMentorshipMatch: (id: string) => request<void>(`/alumni/mentorship-matches/${id}`, { method: 'DELETE' }),

  getPrincipalSummary: () => request<PrincipalSummary>('/dashboard/principal-summary'),
  getAttendanceTrend: () =>
    request<{ name: string; present: number; absent: number; late: number; excused: number }[]>(
      '/dashboard/attendance-trend',
    ),
  getExamPerformance: () =>
    request<{
      scoreByGrade: { name: string; value: number }[];
      topStudents: { name: string; averagePercent: number }[];
      topByGrade: { grade: string; name: string; averagePercent: number }[];
    }>('/dashboard/exam-performance'),
  getFeeDefaulters: (classId?: string) =>
    request<{
      students: {
        studentId: string;
        name: string;
        grade: string;
        section: string;
        assigned: number;
        paid: number;
        balance: number;
      }[];
      totalOutstanding: number;
    }>(`/dashboard/fee-defaulters${classId ? `?classId=${classId}` : ''}`),
  getAcademicPerformers: (classId?: string) =>
    request<{
      top: { studentId: string; name: string; grade: string; section: string; averagePercent: number }[];
      bottom: { studentId: string; name: string; grade: string; section: string; averagePercent: number }[];
    }>(`/dashboard/academic-performers${classId ? `?classId=${classId}` : ''}`),
  getStudentAttendanceExceptions: (classId?: string) =>
    request<{
      date: string | null;
      absent: { studentId: string; name: string; grade: string; section: string }[];
      onLeave: { studentId: string; name: string; grade: string; section: string }[];
      pctAbsent: number;
      pctOnLeave: number;
    }>(`/dashboard/student-attendance-exceptions${classId ? `?classId=${classId}` : ''}`),
  getStaffAttendanceExceptions: (department?: string) =>
    request<{
      date: string | null;
      absent: { employeeId: string; name: string; department: string }[];
      onLeave: { employeeId: string; name: string; department: string }[];
      pctAbsent: number;
      pctOnLeave: number;
    }>(`/dashboard/staff-attendance-exceptions${department ? `?department=${encodeURIComponent(department)}` : ''}`),
};

export { ApiError };
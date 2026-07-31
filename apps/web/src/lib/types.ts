export interface Tenant {
  id: string;
  school_name: string;
  subdomain: string;
  primary_color: string;
  status: string;
}

export interface Campus {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  timezone: string;
}

export interface AcademicYear {
  id: string;
  tenant_id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface RolePermission {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve';
}

export interface Role {
  id: string;
  tenant_id: string | null;
  name: string;
  is_system_role: boolean;
  permissions: RolePermission[];
}

export type AdmissionSource = 'walk_in' | 'referral' | 'website' | 'other';
export type AdmissionStage =
  | 'inquiry'
  | 'application_submitted'
  | 'under_review'
  | 'waitlisted'
  | 'approved'
  | 'rejected'
  | 'enrolled'
  | 'withdrawn';

export interface Admission {
  id: string;
  tenant_id: string;
  campus_id: string;
  academic_year_id: string;
  applicant_first_name: string;
  applicant_last_name: string;
  date_of_birth: string;
  desired_grade_level: string;
  desired_section?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  source: AdmissionSource;
  stage: AdmissionStage;
  notes?: string;
  enrolled_student_id?: string;
}

export interface User {
  id: string;
  tenant_id: string;
  campus_id?: string;
  role_id: string;
  /** Set only when this login belongs to a Student (real self-service access). */
  student_id?: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
}

export interface Subject {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  is_elective: boolean;
  elective_group?: string;
}

export interface TeacherSubjectSpecialization {
  id: string;
  tenant_id: string;
  teacher_id: string;
  subject_id: string;
}

export interface ClassElectiveOffering {
  id: string;
  tenant_id: string;
  school_class_id: string;
  subject_id: string;
  created_at: string;
}

export interface StudentElectiveSelection {
  id: string;
  tenant_id: string;
  student_id: string;
  subject_id: string;
  academic_year_id: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolClass {
  id: string;
  tenant_id: string;
  campus_id: string;
  academic_year_id: string;
  grade_level: string;
  section?: string;
  class_teacher_id?: string;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimetableSlot {
  id: string;
  tenant_id: string;
  school_class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  period_number: number;
}

export type StudentGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type StudentStatus =
  | 'enrolled'
  | 'active'
  | 'transferred'
  | 'withdrawn'
  | 'graduated'
  | 'alumni'
  | 'duplicate';

export interface Student {
  id: string;
  tenant_id: string;
  campus_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: StudentGender;
  grade_level: string;
  section?: string;
  school_class_id?: string;
  roll_number?: number;
  academic_year_id: string;
  status: StudentStatus;
  enrollment_date: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  photo_url?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  school_class_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by: string;
  notes?: string;
}

export interface AuthUser {
  id: string;
  tenantId: string | null;
  role: string;
  email: string;
  /** Present only when this account is linked to a Student record. */
  studentId?: string;
  /** Present only when this account is linked (via ParentStudentLink) to one or more Student records. */
  parentOfStudentIds?: string[];
  /**
   * The role's real module+action permission set, returned at login/refresh
   * (see AuthService.issueTokens on the backend) — NOT baked into the JWT
   * itself, just attached to this response object, refreshed every ~15 min
   * on the normal token-refresh cadence. Drives nav visibility via
   * hasPermission() in lib/roles.ts; correctly reflects CUSTOM roles an
   * Admin creates, unlike a hardcoded role-name check. Never a real
   * security boundary — same as every other client-side check — the
   * backend's RbacGuard is what actually enforces this.
   */
  permissions?: RolePermission[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface FeeComponent {
  id: string;
  fee_structure_id: string;
  name: string;
  amount: string;
}

export interface FeeInstallment {
  id: string;
  fee_structure_id: string;
  label: string;
  due_date: string;
  amount: string;
}

export interface FeeStructure {
  id: string;
  tenant_id: string;
  academic_year_id: string;
  grade_level: string;
  name: string;
  components: FeeComponent[];
  installments: FeeInstallment[];
  transport_included: boolean;
}

export interface FeeAssignment {
  id: string;
  tenant_id: string;
  student_id: string;
  fee_structure_id: string;
  academic_year_id: string;
  assigned_at: string;
}

export type FeeAdjustmentType = 'discount' | 'fine';

export interface FeeAdjustment {
  id: string;
  fee_assignment_id: string;
  type: FeeAdjustmentType;
  amount: string;
  reason: string;
  created_by: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';

export interface FeePayment {
  id: string;
  tenant_id: string;
  fee_assignment_id: string;
  fee_installment_id?: string;
  amount: string;
  payment_date: string;
  method: PaymentMethod;
  reference_number?: string;
  recorded_by: string;
  notes?: string;
}

export interface FeeBalanceInstallment {
  id: string;
  label: string;
  due_date: string;
  amount: number;
  paid: number;
  outstanding: number;
}

export interface FeeBalance {
  assignment: FeeAssignment;
  totalOwed: number;
  totalAdjustments: number;
  totalPaid: number;
  outstanding: number;
  installments: FeeBalanceInstallment[];
  transportIncluded: boolean;
}

export type CircularPriority = 'normal' | 'urgent';
export type AudienceScope = 'whole_school' | 'staff' | 'grade' | 'class';

export interface Circular {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  priority: CircularPriority;
  audience_scope: AudienceScope;
  audience_grade_level?: string;
  audience_school_class_id?: string;
  published_by: string;
  published_at: string;
}

export interface CircularReadReceipt {
  id: string;
  circular_id: string;
  user_id: string;
  read_at: string;
}

export interface Exam {
  id: string;
  tenant_id: string;
  subject_id: string;
  school_class_id: string;
  academic_year_id: string;
  name: string;
  exam_date: string;
  max_marks: string;
  exam_group_id?: string | null;
}

export interface ExamResult {
  id: string;
  tenant_id: string;
  exam_id: string;
  student_id: string;
  marks_obtained?: string;
  entered_by: string;
}

export interface ReportCardRow {
  subject: string;
  examName: string;
  maxMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  grade: string | null;
}

export interface ReportCardData {
  studentName: string;
  admissionNumber: string;
  gradeLevel: string;
  section?: string;
  rollNumber?: number;
  academicYearLabel: string;
  schoolName: string;
  rows: ReportCardRow[];
  totalObtained: number;
  totalMax: number;
  overallPercentage: number;
  overallGrade: string;
  attendancePercentage: number | null;
}

/**
 * Bulk exam scheduling (Exam Groups) — lets a coordinator create exams for
 * several subjects across several classes/sections in one action instead
 * of creating each subject/class exam by hand.
 */
export interface ExamGroup {
  id: string;
  tenant_id: string;
  academic_year_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  exams?: Exam[];
  examCount?: number;
  subjectCount?: number;
  classCount?: number;
}

export interface ExamGroupSubjectDefault {
  subject_id: string;
  default_date: string;
  default_max_marks: number;
}

export interface ExamGroupCellOverride {
  subject_id: string;
  school_class_id: string;
  date?: string;
  max_marks?: number;
}

export interface CreateExamGroupPayload {
  tenant_id: string;
  academic_year_id: string;
  name: string;
  subjects: ExamGroupSubjectDefault[];
  school_class_ids: string[];
  overrides?: ExamGroupCellOverride[];
}

export interface ExamGroupSkippedEntry {
  subject_id: string;
  school_class_id: string;
  reason: string;
}

export interface ExamGroupCreateResult {
  group: ExamGroup;
  created: Exam[];
  skipped: ExamGroupSkippedEntry[];
}

export interface ExamGroupDeleteResult {
  deleted: boolean;
}

/** LMS — Assignments (Blueprint Part 2, Module 6). File-upload submissions only. */
export interface Assignment {
  id: string;
  tenant_id: string;
  subject_id: string;
  school_class_id: string;
  academic_year_id: string;
  title: string;
  instructions?: string;
  due_date: string;
  max_score: string;
  created_by: string;
}

export interface AssignmentSubmission {
  id: string;
  tenant_id: string;
  assignment_id: string;
  student_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  submitted_at: string;
  is_late: boolean;
  score?: string | null;
  feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  uploaded_by: string;
}

export interface LearningResource {
  id: string;
  tenant_id: string;
  subject_id: string;
  school_class_id: string;
  academic_year_id: string;
  title: string;
  description?: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface Lecture {
  id: string;
  tenant_id: string;
  subject_id: string;
  school_class_id: string;
  academic_year_id: string;
  title: string;
  description?: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface LectureProgress {
  id: string;
  lecture_id: string;
  student_id: string;
  watched_at: string;
}

export interface DiscussionThread {
  id: string;
  tenant_id: string;
  subject_id: string;
  school_class_id: string;
  academic_year_id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export interface DiscussionPost {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  created_at: string;
}


export type BookCopyStatus = 'available' | 'issued' | 'reserved' | 'lost' | 'under_repair';
export type ReservationStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface Book {
  id: string;
  tenant_id: string;
  title: string;
  author: string;
  isbn?: string | null;
  category?: string | null;
  publisher?: string | null;
  edition?: string | null;
  cover_url?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}


export interface BookWithAvailability extends Book {
  total_copies: number;
  available_copies: number;
}

export interface BookCopy {
  id: string;
  tenant_id: string;
  book_id: string;
  campus_id: string;
  barcode: string;
  status: BookCopyStatus;
  created_at: string;
  updated_at: string;
}


export interface BookWithCopies extends Book {
  copies: BookCopy[];
}

export interface BookIssue {
  id: string;
  tenant_id: string;
  book_copy_id: string;
  student_id: string;
  issued_by: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  returned_by?: string | null;
  fine_amount?: string | null;
  fine_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookReservation {
  id: string;
  tenant_id: string;
  book_id: string;
  student_id: string;
  status: ReservationStatus;
  fulfilled_book_copy_id?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Transportation (Blueprint Part 2, Module 13) ---

export type VehicleStatus = 'active' | 'under_maintenance' | 'retired';
export type DriverStatus = 'active' | 'inactive';

export interface Vehicle {
  id: string;
  tenant_id: string;
  campus_id: string;
  registration_number: string;
  model?: string | null;
  capacity: number;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  tenant_id: string;
  name: string;
  license_number: string;
  phone: string;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id: string;
  tenant_id: string;
  route_id: string;
  name: string;
  sequence_order: number;
  latitude?: string | null;
  longitude?: string | null;
  created_at: string;
  updated_at: string;
}

/** Returned by GET /transportation/routes/:id — the route plus its stops in one call. */
export interface RouteWithStops extends Route {
  stops: RouteStop[];
}

export interface RouteAssignment {
  id: string;
  tenant_id: string;
  route_id: string;
  vehicle_id: string;
  driver_id: string;
  academic_year_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentTransportAssignment {
  id: string;
  tenant_id: string;
  student_id: string;
  route_id: string;
  stop_id: string;
  academic_year_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentTransportOptOut {
  id: string;
  tenant_id: string;
  student_id: string;
  academic_year_id: string;
  created_at: string;
}

// --- Health & Wellness (Blueprint Part 2, Module 16) ---

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type ScreeningType = 'vision' | 'dental' | 'bmi' | 'other';

export interface StudentHealthProfile {
  id: string;
  tenant_id: string;
  student_id: string;
  blood_group: BloodGroup;
  allergies?: string | null;
  chronic_conditions?: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ImmunizationRecord {
  id: string;
  tenant_id: string;
  student_id: string;
  vaccine_name: string;
  date_administered: string;
  recorded_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicVisit {
  id: string;
  tenant_id: string;
  student_id: string;
  visit_date: string;
  reason: string;
  treatment_given?: string | null;
  follow_up_required: boolean;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationAdministration {
  id: string;
  tenant_id: string;
  student_id: string;
  medication_name: string;
  dosage: string;
  administered_at: string;
  administered_by: string;
  consent_confirmed: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreeningCampaign {
  id: string;
  tenant_id: string;
  name: string;
  screening_type: ScreeningType;
  campaign_date: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreeningResult {
  id: string;
  tenant_id: string;
  campaign_id: string;
  student_id: string;
  result_summary?: string | null;
  flagged_for_followup: boolean;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}
// --- Inventory & Assets (Blueprint Part 2, Module 15) ---

export type ItemCategory = 'stationery' | 'uniform' | 'lab_equipment' | 'furniture' | 'other';
export type StockTransactionType = 'received' | 'issued' | 'adjusted';
export type AssetTagStatus = 'in_use' | 'under_repair' | 'retired' | 'lost';
export type ProcurementRequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';

export interface Item {
  id: string;
  tenant_id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  is_trackable_asset: boolean;
  reorder_point?: number | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemStock {
  id: string;
  tenant_id: string;
  item_id: string;
  campus_id: string;
  quantity_on_hand: number;
  created_at: string;
  updated_at: string;
}

/** Returned by GET /inventory-assets/stock — ItemStock joined with the item's name and reorder point. */
export interface StockLevel extends ItemStock {
  item_name: string;
  reorder_point: number | null;
  below_reorder_point: boolean;
}

export interface StockTransaction {
  id: string;
  tenant_id: string;
  item_id: string;
  campus_id: string;
  transaction_type: StockTransactionType;
  quantity: number;
  transaction_date: string;
  recorded_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetTag {
  id: string;
  tenant_id: string;
  item_id: string;
  campus_id: string;
  asset_tag_number: string;
  status: AssetTagStatus;
  assigned_location?: string | null;
  purchase_date?: string | null;
  purchase_cost?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequest {
  id: string;
  tenant_id: string;
  item_id: string;
  campus_id: string;
  requested_by: string;
  quantity_requested: number;
  status: ProcurementRequestStatus;
  requested_date: string;
  approved_by?: string | null;
  approval_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Cafeteria & Meal Management (Blueprint Part 2, Module 22) ---

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type DietaryRestrictionType = 'allergy' | 'vegetarian' | 'vegan' | 'religious' | 'other';

export interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  dietary_tags?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyMenu {
  id: string;
  tenant_id: string;
  menu_date: string;
  meal_type: MealType;
  created_at: string;
  updated_at: string;
}

/** Returned by GET /cafeteria/daily-menus/:id — the menu plus its dishes joined in. */
export interface DailyMenuWithItems extends DailyMenu {
  items: MenuItem[];
}

export interface DailyMenuItem {
  id: string;
  tenant_id: string;
  daily_menu_id: string;
  menu_item_id: string;
  created_at: string;
}

export interface MealAttendanceRecord {
  id: string;
  tenant_id: string;
  student_id: string;
  attendance_date: string;
  meal_type: MealType;
  recorded_by: string;
  created_at: string;
}

export interface MealHeadcount {
  attendance_date: string;
  meal_type: MealType;
  count: number;
}

export interface StudentDietaryRestriction {
  id: string;
  tenant_id: string;
  student_id: string;
  restriction_type: DietaryRestrictionType;
  details: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}
export interface FeatureToggle {
  id: string;
  tenant_id: string;
  feature_key: string;
  enabled: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostelRoom {
  id: string;
  tenant_id: string;
  campus_id: string;
  building_name: string;
  room_number: string;
  floor: number | null;
  capacity: number;
  room_type: 'single' | 'double' | 'dormitory';
  created_at: string;
  updated_at: string;
}

export interface HostelRoomAllocation {
  id: string;
  tenant_id: string;
  room_id: string;
  student_id: string;
  academic_year_id: string;
  allocated_date: string;
  vacated_date: string | null;
  status: 'active' | 'vacated';
  created_at: string;
  updated_at: string;
}

export interface HostelVisitor {
  id: string;
  tenant_id: string;
  student_id: string;
  visitor_name: string;
  relation: string;
  purpose: string | null;
  id_proof_type: string | null;
  id_proof_number: string | null;
  check_in_time: string;
  check_out_time: string | null;
  pass_code: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelMaintenanceRequest {
  id: string;
  tenant_id: string;
  room_id: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  reported_by: string;
  reported_date: string;
  resolved_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostelAttendanceRecord {
  id: string;
  tenant_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'on_leave';
  curfew_check_in_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostelRoomPreference {
  id: string;
  tenant_id: string;
  student_id: string;
  preferred_roommate_id: string | null;
  preferred_floor: number | null;
  notes: string | null;
  matched_room_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface JobOpening {
  id: string;
  tenant_id: string;
  title: string;
  department: string;
  description: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  tenant_id: string;
  job_opening_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  stage: 'applied' | 'screening' | 'interview' | 'offered' | 'hired' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  user_id: string | null;
  manager_id: string | null;
  name: string;
  email: string;
  department: string;
  designation: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  status: 'active' | 'on_leave' | 'terminated';
  date_of_joining: string;
  contract_end_date: string | null;
  base_salary: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  tenant_id: string;
  employee_id: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'unpaid';
  from_date: string;
  to_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAttendanceRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface PerformanceReviewCycle {
  id: string;
  tenant_id: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'calibrating' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  tenant_id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  reviewer_type: 'self' | 'peer' | 'manager';
  rating: number;
  comments: string | null;
  calibrated_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface StaffCertification {
  id: string;
  tenant_id: string;
  employee_id: string;
  certification_name: string;
  issued_date: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuccessionPlan {
  id: string;
  tenant_id: string;
  position_employee_id: string;
  successor_employee_id: string | null;
  readiness_level: 'ready_now' | 'ready_1_2_years' | 'developing' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface SalaryStructure {
  id: string;
  tenant_id: string;
  employee_id: string;
  basic_salary: string;
  hra: string;
  special_allowance: string;
  other_allowances: string;
  effective_from: string;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_account_holder_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  month: number;
  year: number;
  status: 'draft' | 'processed' | 'disbursed';
  processed_date: string | null;
  bank_file_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: string;
  tenant_id: string;
  payroll_run_id: string;
  employee_id: string;
  basic_salary: string;
  hra: string;
  special_allowance: string;
  other_allowances: string;
  gross_salary: string;
  pf_employee: string;
  pf_employer: string;
  esi_employee: string;
  esi_employer: string;
  professional_tax: string;
  bonuses: string;
  overtime: string;
  reimbursements: string;
  loan_deduction: string;
  net_salary: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettings {
  id: string;
  tenant_id: string;
  professional_tax_amount: string;
  created_at: string;
  updated_at: string;
}

export interface LoanAdvance {
  id: string;
  tenant_id: string;
  employee_id: string;
  amount: string;
  monthly_recovery_amount: string;
  remaining_balance: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface FullFinalSettlement {
  id: string;
  tenant_id: string;
  employee_id: string;
  last_working_date: string;
  dues: string;
  deductions: string;
  net_settlement_amount: string;
  status: 'pending' | 'processed';
  created_at: string;
  updated_at: string;
}
// --- Document Management & Digital Signatures (Blueprint Part 2, Module 19) ---

export type DocumentCategory = 'hr_policy' | 'student_document' | 'staff_document' | 'other';
export type DocumentApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface SchoolDocument {
  id: string;
  tenant_id: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  related_student_id?: string | null;
  related_employee_id?: string | null;
  file_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  version: number;
  supersedes_document_id?: string | null;
  approval_status: DocumentApprovalStatus;
  approved_by?: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAcknowledgment {
  id: string;
  tenant_id: string;
  document_id: string;
  acknowledged_by: string;
  acknowledged_at: string;
}

export type CertificateType = 'bonafide' | 'transfer' | 'character';

export interface Certificate {
  id: string;
  tenant_id: string;
  student_id: string;
  certificate_type: CertificateType;
  issued_date: string;
  issued_by: string;
  created_at: string;
}

export type ActivityCategory = 'club' | 'sport' | 'cultural';

export interface Activity {
  id: string;
  tenant_id: string;
  name: string;
  category: ActivityCategory;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRoster {
  id: string;
  tenant_id: string;
  activity_id: string;
  student_id: string;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export type EventType = 'competition' | 'cultural' | 'fixture';
export type FixtureResult = 'win' | 'loss' | 'draw';

export interface SchoolEvent {
  id: string;
  tenant_id: string;
  activity_id?: string | null;
  name: string;
  event_type: EventType;
  event_date: string;
  location?: string | null;
  opponent_name?: string | null;
  our_score?: number | null;
  opponent_score?: number | null;
  result?: FixtureResult | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  tenant_id: string;
  event_id: string;
  student_id: string;
  registered_at: string;
  updated_at: string;
}

export interface Award {
  id: string;
  tenant_id: string;
  student_id: string;
  event_id?: string | null;
  title: string;
  awarded_date: string;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

export type IncidentType = 'merit' | 'demerit';
export type IncidentStatus = 'open' | 'resolved' | 'escalated';

export interface BehaviorIncident {
  id: string;
  tenant_id: string;
  student_id: string;
  reported_by: string;
  incident_date: string;
  incident_type: IncidentType;
  points: number;
  description: string;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
}

export interface PointsBalance {
  studentId: string;
  pointsBalance: number;
  incidentCount: number;
}

export type CorrectiveActionStatus = 'pending' | 'completed';

export interface CorrectiveAction {
  id: string;
  tenant_id: string;
  incident_id: string;
  description: string;
  assigned_to: string;
  due_date: string;
  completed_date?: string | null;
  status: CorrectiveActionStatus;
  created_at: string;
  updated_at: string;
}

export type CounselingReferralStatus = 'pending' | 'in_progress' | 'completed';

export interface CounselingReferral {
  id: string;
  tenant_id: string;
  incident_id: string;
  referred_to: string;
  reason: string;
  status: CounselingReferralStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniProfile {
  id: string;
  tenant_id: string;
  student_id: string;
  graduation_year: number;
  current_occupation?: string | null;
  current_employer?: string | null;
  current_city?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniEvent {
  id: string;
  tenant_id: string;
  name: string;
  event_date: string;
  location?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniEventRegistration {
  id: string;
  tenant_id: string;
  event_id: string;
  alumni_id: string;
  registered_at: string;
}

export type DonationPaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';

export interface Donation {
  id: string;
  tenant_id: string;
  alumni_id: string;
  amount: string;
  donation_date: string;
  purpose?: string | null;
  payment_method: DonationPaymentMethod;
  recorded_by: string;
  notes?: string | null;
  created_at: string;
}

export interface DonationTotal {
  alumniId: string;
  totalDonated: number;
  donationCount: number;
}

export type MentorshipMatchStatus = 'active' | 'completed';

export interface MentorshipMatch {
  id: string;
  tenant_id: string;
  mentor_alumni_id: string;
  mentee_student_id: string;
  status: MentorshipMatchStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type DiaryEntryScope = 'class' | 'student';
export type DiaryEntryCategory = 'Homework' | 'Remark' | 'Notice' | 'General';

export interface DiaryReply {
  id: string;
  tenant_id: string;
  diary_entry_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  tenant_id: string;
  campus_id: string;
  class_id: string;
  scope: DiaryEntryScope;
  student_id: string | null;
  author_id: string;
  category: DiaryEntryCategory;
  content: string;
  entry_date: string;
  replies: DiaryReply[];
  created_at: string;
  updated_at: string;
}

export interface TeacherSubjectSpecialization {
  id: string;
  tenant_id: string;
  teacher_id: string;
  subject_id: string;
}

export type PlanTier = 'starter' | 'growth' | 'enterprise' | 'platform';
export type SubscriptionStatus = 'active' | 'cancelled';

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  started_at: string;
  ended_at?: string | null;
  set_by?: string | null;
}

export type PaymentMode = 'bank_transfer' | 'card' | 'cheque' | 'invoice' | 'other';

export interface PaymentRecord {
  id: string;
  tenant_id: string;
  payment_mode: PaymentMode;
  amount: string;
  payment_date: string;
  notes?: string;
  recorded_by?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
}

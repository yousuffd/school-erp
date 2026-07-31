--
-- PostgreSQL database dump
--

\restrict E8gdBAURh3IWYESV2AJfCuxDlOR1ppFsbmN9eXK7oE1jBqUEOnvhW5zbMliNqCJ

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activities_category_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.activities_category_enum AS ENUM (
    'club',
    'sport',
    'cultural'
);


ALTER TYPE public.activities_category_enum OWNER TO school_erp;

--
-- Name: admissions_source_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.admissions_source_enum AS ENUM (
    'walk_in',
    'referral',
    'website',
    'other'
);


ALTER TYPE public.admissions_source_enum OWNER TO school_erp;

--
-- Name: admissions_stage_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.admissions_stage_enum AS ENUM (
    'inquiry',
    'application_submitted',
    'under_review',
    'waitlisted',
    'approved',
    'rejected',
    'enrolled',
    'withdrawn'
);


ALTER TYPE public.admissions_stage_enum OWNER TO school_erp;

--
-- Name: applicants_stage_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.applicants_stage_enum AS ENUM (
    'applied',
    'screening',
    'interview',
    'offered',
    'hired',
    'rejected'
);


ALTER TYPE public.applicants_stage_enum OWNER TO school_erp;

--
-- Name: asset_tags_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.asset_tags_status_enum AS ENUM (
    'in_use',
    'under_repair',
    'retired',
    'lost'
);


ALTER TYPE public.asset_tags_status_enum OWNER TO school_erp;

--
-- Name: attendance_records_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.attendance_records_status_enum AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);


ALTER TYPE public.attendance_records_status_enum OWNER TO school_erp;

--
-- Name: behavior_incidents_incident_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.behavior_incidents_incident_type_enum AS ENUM (
    'merit',
    'demerit'
);


ALTER TYPE public.behavior_incidents_incident_type_enum OWNER TO school_erp;

--
-- Name: behavior_incidents_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.behavior_incidents_status_enum AS ENUM (
    'open',
    'resolved',
    'escalated'
);


ALTER TYPE public.behavior_incidents_status_enum OWNER TO school_erp;

--
-- Name: book_copies_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.book_copies_status_enum AS ENUM (
    'available',
    'issued',
    'reserved',
    'lost',
    'under_repair'
);


ALTER TYPE public.book_copies_status_enum OWNER TO school_erp;

--
-- Name: book_reservations_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.book_reservations_status_enum AS ENUM (
    'pending',
    'fulfilled',
    'cancelled'
);


ALTER TYPE public.book_reservations_status_enum OWNER TO school_erp;

--
-- Name: certificates_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.certificates_type_enum AS ENUM (
    'bonafide',
    'transfer',
    'character'
);


ALTER TYPE public.certificates_type_enum OWNER TO school_erp;

--
-- Name: circulars_audience_scope_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.circulars_audience_scope_enum AS ENUM (
    'whole_school',
    'grade',
    'class'
);


ALTER TYPE public.circulars_audience_scope_enum OWNER TO school_erp;

--
-- Name: circulars_priority_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.circulars_priority_enum AS ENUM (
    'normal',
    'urgent'
);


ALTER TYPE public.circulars_priority_enum OWNER TO school_erp;

--
-- Name: corrective_actions_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.corrective_actions_status_enum AS ENUM (
    'pending',
    'completed'
);


ALTER TYPE public.corrective_actions_status_enum OWNER TO school_erp;

--
-- Name: counseling_referrals_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.counseling_referrals_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE public.counseling_referrals_status_enum OWNER TO school_erp;

--
-- Name: diary_entry_category_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.diary_entry_category_enum AS ENUM (
    'Homework',
    'Remark',
    'Notice',
    'General'
);


ALTER TYPE public.diary_entry_category_enum OWNER TO school_erp;

--
-- Name: diary_entry_scope_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.diary_entry_scope_enum AS ENUM (
    'class',
    'student'
);


ALTER TYPE public.diary_entry_scope_enum OWNER TO school_erp;

--
-- Name: documents_approval_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.documents_approval_status_enum AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'rejected'
);


ALTER TYPE public.documents_approval_status_enum OWNER TO school_erp;

--
-- Name: documents_category_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.documents_category_enum AS ENUM (
    'hr_policy',
    'student_document',
    'staff_document',
    'other'
);


ALTER TYPE public.documents_category_enum OWNER TO school_erp;

--
-- Name: donations_payment_method_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.donations_payment_method_enum AS ENUM (
    'cash',
    'bank_transfer',
    'upi',
    'cheque',
    'other'
);


ALTER TYPE public.donations_payment_method_enum OWNER TO school_erp;

--
-- Name: drivers_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.drivers_status_enum AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.drivers_status_enum OWNER TO school_erp;

--
-- Name: employees_employment_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.employees_employment_type_enum AS ENUM (
    'full_time',
    'part_time',
    'contract'
);


ALTER TYPE public.employees_employment_type_enum OWNER TO school_erp;

--
-- Name: employees_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.employees_status_enum AS ENUM (
    'active',
    'on_leave',
    'terminated'
);


ALTER TYPE public.employees_status_enum OWNER TO school_erp;

--
-- Name: events_event_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.events_event_type_enum AS ENUM (
    'competition',
    'cultural',
    'fixture'
);


ALTER TYPE public.events_event_type_enum OWNER TO school_erp;

--
-- Name: events_result_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.events_result_enum AS ENUM (
    'win',
    'loss',
    'draw'
);


ALTER TYPE public.events_result_enum OWNER TO school_erp;

--
-- Name: fee_adjustments_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.fee_adjustments_type_enum AS ENUM (
    'discount',
    'fine'
);


ALTER TYPE public.fee_adjustments_type_enum OWNER TO school_erp;

--
-- Name: fee_payments_method_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.fee_payments_method_enum AS ENUM (
    'cash',
    'bank_transfer',
    'upi',
    'cheque',
    'other'
);


ALTER TYPE public.fee_payments_method_enum OWNER TO school_erp;

--
-- Name: full_final_settlements_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.full_final_settlements_status_enum AS ENUM (
    'pending',
    'processed'
);


ALTER TYPE public.full_final_settlements_status_enum OWNER TO school_erp;

--
-- Name: hostel_attendance_records_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.hostel_attendance_records_status_enum AS ENUM (
    'present',
    'absent',
    'on_leave'
);


ALTER TYPE public.hostel_attendance_records_status_enum OWNER TO school_erp;

--
-- Name: hostel_maintenance_requests_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.hostel_maintenance_requests_status_enum AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


ALTER TYPE public.hostel_maintenance_requests_status_enum OWNER TO school_erp;

--
-- Name: hostel_room_allocations_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.hostel_room_allocations_status_enum AS ENUM (
    'active',
    'vacated'
);


ALTER TYPE public.hostel_room_allocations_status_enum OWNER TO school_erp;

--
-- Name: hostel_rooms_room_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.hostel_rooms_room_type_enum AS ENUM (
    'single',
    'double',
    'dormitory'
);


ALTER TYPE public.hostel_rooms_room_type_enum OWNER TO school_erp;

--
-- Name: items_category_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.items_category_enum AS ENUM (
    'stationery',
    'uniform',
    'lab_equipment',
    'furniture',
    'other'
);


ALTER TYPE public.items_category_enum OWNER TO school_erp;

--
-- Name: job_openings_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.job_openings_status_enum AS ENUM (
    'open',
    'closed'
);


ALTER TYPE public.job_openings_status_enum OWNER TO school_erp;

--
-- Name: leave_requests_leave_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.leave_requests_leave_type_enum AS ENUM (
    'casual',
    'sick',
    'earned',
    'unpaid'
);


ALTER TYPE public.leave_requests_leave_type_enum OWNER TO school_erp;

--
-- Name: leave_requests_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.leave_requests_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.leave_requests_status_enum OWNER TO school_erp;

--
-- Name: loan_advances_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.loan_advances_status_enum AS ENUM (
    'active',
    'closed'
);


ALTER TYPE public.loan_advances_status_enum OWNER TO school_erp;

--
-- Name: meal_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.meal_type_enum AS ENUM (
    'breakfast',
    'lunch',
    'snack',
    'dinner'
);


ALTER TYPE public.meal_type_enum OWNER TO school_erp;

--
-- Name: mentorship_matches_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.mentorship_matches_status_enum AS ENUM (
    'active',
    'completed'
);


ALTER TYPE public.mentorship_matches_status_enum OWNER TO school_erp;

--
-- Name: payroll_runs_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.payroll_runs_status_enum AS ENUM (
    'draft',
    'processed',
    'disbursed'
);


ALTER TYPE public.payroll_runs_status_enum OWNER TO school_erp;

--
-- Name: performance_review_cycles_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.performance_review_cycles_status_enum AS ENUM (
    'open',
    'calibrating',
    'closed'
);


ALTER TYPE public.performance_review_cycles_status_enum OWNER TO school_erp;

--
-- Name: performance_reviews_reviewer_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.performance_reviews_reviewer_type_enum AS ENUM (
    'self',
    'peer',
    'manager'
);


ALTER TYPE public.performance_reviews_reviewer_type_enum OWNER TO school_erp;

--
-- Name: procurement_requests_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.procurement_requests_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'fulfilled'
);


ALTER TYPE public.procurement_requests_status_enum OWNER TO school_erp;

--
-- Name: screening_campaigns_screening_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.screening_campaigns_screening_type_enum AS ENUM (
    'vision',
    'dental',
    'bmi',
    'other'
);


ALTER TYPE public.screening_campaigns_screening_type_enum OWNER TO school_erp;

--
-- Name: staff_attendance_records_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.staff_attendance_records_status_enum AS ENUM (
    'present',
    'absent',
    'on_leave'
);


ALTER TYPE public.staff_attendance_records_status_enum OWNER TO school_erp;

--
-- Name: stock_transactions_transaction_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.stock_transactions_transaction_type_enum AS ENUM (
    'received',
    'issued',
    'adjusted'
);


ALTER TYPE public.stock_transactions_transaction_type_enum OWNER TO school_erp;

--
-- Name: student_dietary_restrictions_restriction_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.student_dietary_restrictions_restriction_type_enum AS ENUM (
    'allergy',
    'vegetarian',
    'vegan',
    'religious',
    'other'
);


ALTER TYPE public.student_dietary_restrictions_restriction_type_enum OWNER TO school_erp;

--
-- Name: student_health_profiles_blood_group_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.student_health_profiles_blood_group_enum AS ENUM (
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
    'unknown'
);


ALTER TYPE public.student_health_profiles_blood_group_enum OWNER TO school_erp;

--
-- Name: students_gender_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.students_gender_enum AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);


ALTER TYPE public.students_gender_enum OWNER TO school_erp;

--
-- Name: students_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.students_status_enum AS ENUM (
    'enrolled',
    'active',
    'transferred',
    'withdrawn',
    'graduated',
    'alumni',
    'duplicate'
);


ALTER TYPE public.students_status_enum OWNER TO school_erp;

--
-- Name: succession_plans_readiness_level_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.succession_plans_readiness_level_enum AS ENUM (
    'ready_now',
    'ready_1_2_years',
    'developing'
);


ALTER TYPE public.succession_plans_readiness_level_enum OWNER TO school_erp;

--
-- Name: tenants_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.tenants_status_enum AS ENUM (
    'provisioning',
    'active',
    'suspended',
    'offboarded'
);


ALTER TYPE public.tenants_status_enum OWNER TO school_erp;

--
-- Name: timetable_slots_day_of_week_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.timetable_slots_day_of_week_enum AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
);


ALTER TYPE public.timetable_slots_day_of_week_enum OWNER TO school_erp;

--
-- Name: users_auth_provider_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.users_auth_provider_enum AS ENUM (
    'local',
    'google_sso',
    'microsoft_sso',
    'saml'
);


ALTER TYPE public.users_auth_provider_enum OWNER TO school_erp;

--
-- Name: users_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.users_status_enum AS ENUM (
    'invited',
    'active',
    'disabled'
);


ALTER TYPE public.users_status_enum OWNER TO school_erp;

--
-- Name: vehicle_maintenance_records_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.vehicle_maintenance_records_status_enum AS ENUM (
    'scheduled',
    'completed',
    'overdue'
);


ALTER TYPE public.vehicle_maintenance_records_status_enum OWNER TO school_erp;

--
-- Name: vehicle_maintenance_records_type_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.vehicle_maintenance_records_type_enum AS ENUM (
    'routine',
    'repair',
    'inspection'
);


ALTER TYPE public.vehicle_maintenance_records_type_enum OWNER TO school_erp;

--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: school_erp
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'active',
    'under_maintenance',
    'retired'
);


ALTER TYPE public.vehicles_status_enum OWNER TO school_erp;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    label character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.academic_years OWNER TO school_erp;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    category public.activities_category_enum NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activities OWNER TO school_erp;

--
-- Name: activity_rosters; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.activity_rosters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    student_id uuid NOT NULL,
    joined_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_rosters OWNER TO school_erp;

--
-- Name: admissions; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.admissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    applicant_first_name character varying(100) NOT NULL,
    applicant_last_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    desired_grade_level character varying(40) NOT NULL,
    guardian_name character varying(150) NOT NULL,
    guardian_phone character varying(32) NOT NULL,
    guardian_email character varying(254),
    source public.admissions_source_enum DEFAULT 'other'::public.admissions_source_enum NOT NULL,
    stage public.admissions_stage_enum DEFAULT 'inquiry'::public.admissions_stage_enum NOT NULL,
    notes text,
    enrolled_student_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admissions OWNER TO school_erp;

--
-- Name: alumni_event_registrations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.alumni_event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_id uuid NOT NULL,
    alumni_id uuid NOT NULL,
    registered_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alumni_event_registrations OWNER TO school_erp;

--
-- Name: alumni_events; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.alumni_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    event_date date NOT NULL,
    location character varying(200),
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alumni_events OWNER TO school_erp;

--
-- Name: alumni_profiles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.alumni_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    graduation_year integer NOT NULL,
    current_occupation character varying(150),
    current_employer character varying(150),
    current_city character varying(100),
    contact_email character varying(254),
    contact_phone character varying(32),
    linkedin_url character varying(300),
    bio text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alumni_profiles OWNER TO school_erp;

--
-- Name: applicants; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    job_opening_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    phone character varying(32),
    resume_url character varying,
    stage public.applicants_stage_enum DEFAULT 'applied'::public.applicants_stage_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.applicants OWNER TO school_erp;

--
-- Name: asset_tags; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.asset_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    item_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    asset_tag_number character varying(50) NOT NULL,
    status public.asset_tags_status_enum DEFAULT 'in_use'::public.asset_tags_status_enum NOT NULL,
    assigned_location character varying(150),
    purchase_date date,
    purchase_cost numeric(10,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asset_tags OWNER TO school_erp;

--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    file_path character varying(500) NOT NULL,
    original_filename character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    score numeric(6,2),
    feedback text,
    graded_by uuid,
    graded_at timestamp without time zone,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignment_submissions OWNER TO school_erp;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    instructions text,
    due_date timestamp without time zone NOT NULL,
    max_score numeric(6,2) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignments OWNER TO school_erp;

--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.attendance_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    date date NOT NULL,
    status public.attendance_records_status_enum NOT NULL,
    marked_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendance_records OWNER TO school_erp;

--
-- Name: awards; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    event_id uuid,
    title character varying(200) NOT NULL,
    awarded_date date NOT NULL,
    issued_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.awards OWNER TO school_erp;

--
-- Name: behavior_incidents; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.behavior_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    reported_by uuid NOT NULL,
    incident_date date NOT NULL,
    incident_type public.behavior_incidents_incident_type_enum NOT NULL,
    points integer NOT NULL,
    description text NOT NULL,
    status public.behavior_incidents_status_enum DEFAULT 'open'::public.behavior_incidents_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.behavior_incidents OWNER TO school_erp;

--
-- Name: book_copies; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.book_copies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    book_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    barcode character varying(50) NOT NULL,
    status public.book_copies_status_enum DEFAULT 'available'::public.book_copies_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_copies OWNER TO school_erp;

--
-- Name: book_issues; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.book_issues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    book_copy_id uuid NOT NULL,
    student_id uuid NOT NULL,
    issued_by uuid NOT NULL,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    return_date date,
    returned_by uuid,
    fine_amount numeric(6,2),
    fine_paid boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_issues OWNER TO school_erp;

--
-- Name: book_reservations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.book_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    book_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status public.book_reservations_status_enum DEFAULT 'pending'::public.book_reservations_status_enum NOT NULL,
    fulfilled_book_copy_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_reservations OWNER TO school_erp;

--
-- Name: books; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(300) NOT NULL,
    author character varying(200) NOT NULL,
    isbn character varying(20),
    category character varying(100),
    publisher character varying(150),
    edition character varying(50),
    cover_url character varying,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO school_erp;

--
-- Name: campuses; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.campuses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    address text,
    timezone character varying(64) DEFAULT 'UTC'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campuses OWNER TO school_erp;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    certificate_type public.certificates_type_enum NOT NULL,
    issued_date date NOT NULL,
    issued_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.certificates OWNER TO school_erp;

--
-- Name: circular_read_receipts; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.circular_read_receipts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    circular_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.circular_read_receipts OWNER TO school_erp;

--
-- Name: circulars; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.circulars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    priority public.circulars_priority_enum DEFAULT 'normal'::public.circulars_priority_enum NOT NULL,
    audience_scope public.circulars_audience_scope_enum NOT NULL,
    audience_grade_level character varying(40),
    audience_school_class_id uuid,
    published_by uuid NOT NULL,
    published_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.circulars OWNER TO school_erp;

--
-- Name: class_elective_offerings; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.class_elective_offerings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_elective_offerings OWNER TO school_erp;

--
-- Name: clinic_visits; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.clinic_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    visit_date timestamp without time zone NOT NULL,
    reason text NOT NULL,
    treatment_given text,
    follow_up_required boolean DEFAULT false NOT NULL,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clinic_visits OWNER TO school_erp;

--
-- Name: corrective_actions; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.corrective_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    incident_id uuid NOT NULL,
    description text NOT NULL,
    assigned_to uuid NOT NULL,
    due_date date NOT NULL,
    completed_date date,
    status public.corrective_actions_status_enum DEFAULT 'pending'::public.corrective_actions_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.corrective_actions OWNER TO school_erp;

--
-- Name: counseling_referrals; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.counseling_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    incident_id uuid NOT NULL,
    referred_to uuid NOT NULL,
    reason text NOT NULL,
    status public.counseling_referrals_status_enum DEFAULT 'pending'::public.counseling_referrals_status_enum NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.counseling_referrals OWNER TO school_erp;

--
-- Name: daily_menu_items; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.daily_menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    daily_menu_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_menu_items OWNER TO school_erp;

--
-- Name: daily_menus; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.daily_menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    menu_date date NOT NULL,
    meal_type public.meal_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_menus OWNER TO school_erp;

--
-- Name: diary_entries; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.diary_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    class_id uuid NOT NULL,
    scope public.diary_entry_scope_enum NOT NULL,
    student_id uuid,
    author_id uuid NOT NULL,
    category public.diary_entry_category_enum DEFAULT 'General'::public.diary_entry_category_enum NOT NULL,
    content text NOT NULL,
    entry_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT "CHK_diary_entry_student_scope" CHECK ((((scope = 'student'::public.diary_entry_scope_enum) AND (student_id IS NOT NULL)) OR ((scope = 'class'::public.diary_entry_scope_enum) AND (student_id IS NULL))))
);


ALTER TABLE public.diary_entries OWNER TO school_erp;

--
-- Name: diary_replies; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.diary_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    diary_entry_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.diary_replies OWNER TO school_erp;

--
-- Name: discussion_posts; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.discussion_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    thread_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discussion_posts OWNER TO school_erp;

--
-- Name: discussion_threads; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.discussion_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discussion_threads OWNER TO school_erp;

--
-- Name: document_acknowledgments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.document_acknowledgments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    document_id uuid NOT NULL,
    acknowledged_by uuid NOT NULL,
    acknowledged_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_acknowledgments OWNER TO school_erp;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    category public.documents_category_enum NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    related_student_id uuid,
    related_employee_id uuid,
    file_path character varying NOT NULL,
    original_filename character varying NOT NULL,
    mime_type character varying NOT NULL,
    file_size integer NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    supersedes_document_id uuid,
    approval_status public.documents_approval_status_enum DEFAULT 'approved'::public.documents_approval_status_enum NOT NULL,
    approved_by uuid,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.documents OWNER TO school_erp;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    alumni_id uuid NOT NULL,
    amount numeric NOT NULL,
    donation_date date NOT NULL,
    purpose character varying(200),
    payment_method public.donations_payment_method_enum NOT NULL,
    recorded_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.donations OWNER TO school_erp;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.drivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    license_number character varying(50) NOT NULL,
    phone character varying(32) NOT NULL,
    status public.drivers_status_enum DEFAULT 'active'::public.drivers_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.drivers OWNER TO school_erp;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    manager_id uuid,
    name character varying(200) NOT NULL,
    email character varying(254) NOT NULL,
    department character varying(100) NOT NULL,
    designation character varying(100) NOT NULL,
    employment_type public.employees_employment_type_enum DEFAULT 'full_time'::public.employees_employment_type_enum NOT NULL,
    status public.employees_status_enum DEFAULT 'active'::public.employees_status_enum NOT NULL,
    date_of_joining date NOT NULL,
    contract_end_date date,
    base_salary numeric,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employees OWNER TO school_erp;

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_id uuid NOT NULL,
    student_id uuid NOT NULL,
    registered_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_registrations OWNER TO school_erp;

--
-- Name: events; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    activity_id uuid,
    name character varying(150) NOT NULL,
    event_type public.events_event_type_enum NOT NULL,
    event_date date NOT NULL,
    location character varying(200),
    opponent_name character varying(150),
    our_score integer,
    opponent_score integer,
    result public.events_result_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO school_erp;

--
-- Name: exam_groups; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.exam_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exam_groups OWNER TO school_erp;

--
-- Name: exam_results; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.exam_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    exam_id uuid NOT NULL,
    student_id uuid NOT NULL,
    marks_obtained numeric(6,2),
    entered_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exam_results OWNER TO school_erp;

--
-- Name: exams; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.exams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    exam_date date NOT NULL,
    max_marks numeric(6,2) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    exam_group_id uuid
);


ALTER TABLE public.exams OWNER TO school_erp;

--
-- Name: fee_adjustments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_adjustments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    fee_assignment_id uuid NOT NULL,
    type public.fee_adjustments_type_enum NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason character varying(255) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_adjustments OWNER TO school_erp;

--
-- Name: fee_assignments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    fee_structure_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_assignments OWNER TO school_erp;

--
-- Name: fee_components; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_components (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fee_structure_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL
);


ALTER TABLE public.fee_components OWNER TO school_erp;

--
-- Name: fee_installments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_installments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fee_structure_id uuid NOT NULL,
    label character varying(60) NOT NULL,
    due_date date NOT NULL,
    amount numeric(12,2) NOT NULL
);


ALTER TABLE public.fee_installments OWNER TO school_erp;

--
-- Name: fee_payments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    fee_assignment_id uuid NOT NULL,
    fee_installment_id uuid,
    amount numeric(12,2) NOT NULL,
    payment_date date NOT NULL,
    method public.fee_payments_method_enum NOT NULL,
    reference_number character varying(100),
    recorded_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_payments OWNER TO school_erp;

--
-- Name: fee_structures; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.fee_structures (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    grade_level character varying(40) NOT NULL,
    name character varying(150) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_structures OWNER TO school_erp;

--
-- Name: full_final_settlements; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.full_final_settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    last_working_date date NOT NULL,
    dues numeric DEFAULT 0 NOT NULL,
    deductions numeric DEFAULT 0 NOT NULL,
    net_settlement_amount numeric NOT NULL,
    status public.full_final_settlements_status_enum DEFAULT 'pending'::public.full_final_settlements_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.full_final_settlements OWNER TO school_erp;

--
-- Name: hostel_attendance_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    date date NOT NULL,
    status public.hostel_attendance_records_status_enum NOT NULL,
    curfew_check_in_time time without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_attendance_records OWNER TO school_erp;

--
-- Name: hostel_maintenance_requests; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_maintenance_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    room_id uuid NOT NULL,
    description text NOT NULL,
    status public.hostel_maintenance_requests_status_enum DEFAULT 'open'::public.hostel_maintenance_requests_status_enum NOT NULL,
    reported_by uuid NOT NULL,
    reported_date date NOT NULL,
    resolved_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_maintenance_requests OWNER TO school_erp;

--
-- Name: hostel_room_allocations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_room_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    room_id uuid NOT NULL,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    allocated_date date NOT NULL,
    vacated_date date,
    status public.hostel_room_allocations_status_enum DEFAULT 'active'::public.hostel_room_allocations_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_room_allocations OWNER TO school_erp;

--
-- Name: hostel_room_preferences; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_room_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    preferred_roommate_id uuid,
    preferred_floor integer,
    notes text,
    matched_room_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_room_preferences OWNER TO school_erp;

--
-- Name: hostel_rooms; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    building_name character varying(100) NOT NULL,
    room_number character varying(20) NOT NULL,
    floor integer,
    capacity integer NOT NULL,
    room_type public.hostel_rooms_room_type_enum DEFAULT 'double'::public.hostel_rooms_room_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_rooms OWNER TO school_erp;

--
-- Name: hostel_visitors; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.hostel_visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    visitor_name character varying(150) NOT NULL,
    relation character varying(100) NOT NULL,
    purpose text,
    id_proof_type character varying(50),
    id_proof_number character varying(50),
    check_in_time timestamp without time zone NOT NULL,
    check_out_time timestamp without time zone,
    pass_code character varying(20),
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hostel_visitors OWNER TO school_erp;

--
-- Name: immunization_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.immunization_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    vaccine_name character varying(150) NOT NULL,
    date_administered date NOT NULL,
    recorded_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.immunization_records OWNER TO school_erp;

--
-- Name: item_stocks; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.item_stocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    item_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    quantity_on_hand integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.item_stocks OWNER TO school_erp;

--
-- Name: items; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    category public.items_category_enum NOT NULL,
    unit character varying(20) NOT NULL,
    is_trackable_asset boolean DEFAULT false NOT NULL,
    reorder_point integer,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.items OWNER TO school_erp;

--
-- Name: job_openings; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.job_openings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    department character varying(100) NOT NULL,
    description text,
    status public.job_openings_status_enum DEFAULT 'open'::public.job_openings_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.job_openings OWNER TO school_erp;

--
-- Name: learning_resources; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.learning_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    file_path character varying(500) NOT NULL,
    original_filename character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.learning_resources OWNER TO school_erp;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    leave_type public.leave_requests_leave_type_enum NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    reason text,
    status public.leave_requests_status_enum DEFAULT 'pending'::public.leave_requests_status_enum NOT NULL,
    approved_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO school_erp;

--
-- Name: lecture_progress; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.lecture_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lecture_id uuid NOT NULL,
    student_id uuid NOT NULL,
    watched_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lecture_progress OWNER TO school_erp;

--
-- Name: lectures; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.lectures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    video_path character varying(500) NOT NULL,
    original_filename character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lectures OWNER TO school_erp;

--
-- Name: loan_advances; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.loan_advances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    amount numeric NOT NULL,
    monthly_recovery_amount numeric NOT NULL,
    remaining_balance numeric NOT NULL,
    status public.loan_advances_status_enum DEFAULT 'active'::public.loan_advances_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loan_advances OWNER TO school_erp;

--
-- Name: meal_attendance_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.meal_attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    attendance_date date NOT NULL,
    meal_type public.meal_type_enum NOT NULL,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.meal_attendance_records OWNER TO school_erp;

--
-- Name: medication_administrations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.medication_administrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    medication_name character varying(150) NOT NULL,
    dosage character varying(50) NOT NULL,
    administered_at timestamp without time zone NOT NULL,
    administered_by uuid NOT NULL,
    consent_confirmed boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medication_administrations OWNER TO school_erp;

--
-- Name: mentorship_matches; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.mentorship_matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    mentor_alumni_id uuid NOT NULL,
    mentee_student_id uuid NOT NULL,
    status public.mentorship_matches_status_enum DEFAULT 'active'::public.mentorship_matches_status_enum NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mentorship_matches OWNER TO school_erp;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    dietary_tags character varying(300),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menu_items OWNER TO school_erp;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO school_erp;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: school_erp
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO school_erp;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: school_erp
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: parent_student_links; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.parent_student_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    parent_user_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.parent_student_links OWNER TO school_erp;

--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.payroll_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    status public.payroll_runs_status_enum DEFAULT 'draft'::public.payroll_runs_status_enum NOT NULL,
    processed_date date,
    bank_file_generated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_runs OWNER TO school_erp;

--
-- Name: payroll_settings; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.payroll_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    professional_tax_amount numeric DEFAULT 200 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_settings OWNER TO school_erp;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    payroll_run_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    basic_salary numeric NOT NULL,
    hra numeric DEFAULT 0 NOT NULL,
    special_allowance numeric DEFAULT 0 NOT NULL,
    other_allowances numeric DEFAULT 0 NOT NULL,
    gross_salary numeric NOT NULL,
    pf_employee numeric DEFAULT 0 NOT NULL,
    pf_employer numeric DEFAULT 0 NOT NULL,
    esi_employee numeric DEFAULT 0 NOT NULL,
    esi_employer numeric DEFAULT 0 NOT NULL,
    professional_tax numeric DEFAULT 0 NOT NULL,
    bonuses numeric DEFAULT 0 NOT NULL,
    overtime numeric DEFAULT 0 NOT NULL,
    reimbursements numeric DEFAULT 0 NOT NULL,
    loan_deduction numeric DEFAULT 0 NOT NULL,
    net_salary numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payslips OWNER TO school_erp;

--
-- Name: performance_review_cycles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.performance_review_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    cycle_name character varying(150) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.performance_review_cycles_status_enum DEFAULT 'open'::public.performance_review_cycles_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.performance_review_cycles OWNER TO school_erp;

--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    cycle_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewer_type public.performance_reviews_reviewer_type_enum NOT NULL,
    rating integer NOT NULL,
    comments text,
    calibrated_rating integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.performance_reviews OWNER TO school_erp;

--
-- Name: procurement_requests; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.procurement_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    item_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    quantity_requested integer NOT NULL,
    status public.procurement_requests_status_enum DEFAULT 'pending'::public.procurement_requests_status_enum NOT NULL,
    requested_date date NOT NULL,
    approved_by uuid,
    approval_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.procurement_requests OWNER TO school_erp;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    name character varying(100) NOT NULL,
    is_system_role boolean DEFAULT false NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO school_erp;

--
-- Name: route_assignments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.route_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    route_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.route_assignments OWNER TO school_erp;

--
-- Name: route_stops; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.route_stops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    route_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    sequence_order integer NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.route_stops OWNER TO school_erp;

--
-- Name: routes; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.routes OWNER TO school_erp;

--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.salary_structures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    basic_salary numeric NOT NULL,
    hra numeric DEFAULT 0 NOT NULL,
    special_allowance numeric DEFAULT 0 NOT NULL,
    other_allowances numeric DEFAULT 0 NOT NULL,
    effective_from date NOT NULL,
    bank_account_number character varying(50),
    bank_ifsc_code character varying(20),
    bank_account_holder_name character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.salary_structures OWNER TO school_erp;

--
-- Name: school_classes; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.school_classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    grade_level character varying(40) NOT NULL,
    section character varying(20),
    class_teacher_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.school_classes OWNER TO school_erp;

--
-- Name: screening_campaigns; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.screening_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    screening_type public.screening_campaigns_screening_type_enum NOT NULL,
    campaign_date date NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.screening_campaigns OWNER TO school_erp;

--
-- Name: screening_results; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.screening_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    student_id uuid NOT NULL,
    result_summary text,
    flagged_for_followup boolean DEFAULT false NOT NULL,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.screening_results OWNER TO school_erp;

--
-- Name: staff_attendance_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.staff_attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    date date NOT NULL,
    status public.staff_attendance_records_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff_attendance_records OWNER TO school_erp;

--
-- Name: staff_certifications; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.staff_certifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    certification_name character varying(150) NOT NULL,
    issued_date date NOT NULL,
    expiry_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff_certifications OWNER TO school_erp;

--
-- Name: stock_transactions; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.stock_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    item_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    transaction_type public.stock_transactions_transaction_type_enum NOT NULL,
    quantity integer NOT NULL,
    transaction_date date NOT NULL,
    recorded_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stock_transactions OWNER TO school_erp;

--
-- Name: student_dietary_restrictions; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.student_dietary_restrictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    restriction_type public.student_dietary_restrictions_restriction_type_enum NOT NULL,
    details text NOT NULL,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_dietary_restrictions OWNER TO school_erp;

--
-- Name: student_elective_selections; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.student_elective_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_elective_selections OWNER TO school_erp;

--
-- Name: student_health_profiles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.student_health_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    blood_group public.student_health_profiles_blood_group_enum DEFAULT 'unknown'::public.student_health_profiles_blood_group_enum NOT NULL,
    allergies text,
    chronic_conditions text,
    updated_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_health_profiles OWNER TO school_erp;

--
-- Name: student_transport_assignments; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.student_transport_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    student_id uuid NOT NULL,
    route_id uuid NOT NULL,
    stop_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_transport_assignments OWNER TO school_erp;

--
-- Name: students; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    admission_number character varying(40) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    gender public.students_gender_enum DEFAULT 'prefer_not_to_say'::public.students_gender_enum NOT NULL,
    grade_level character varying(40) NOT NULL,
    section character varying(20),
    academic_year_id uuid NOT NULL,
    status public.students_status_enum DEFAULT 'enrolled'::public.students_status_enum NOT NULL,
    enrollment_date date NOT NULL,
    guardian_name character varying(150) NOT NULL,
    guardian_phone character varying(32) NOT NULL,
    guardian_email character varying(254),
    emergency_contact_name character varying(150),
    emergency_contact_phone character varying(32),
    medical_notes text,
    photo_url character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    school_class_id uuid,
    roll_number integer
);


ALTER TABLE public.students OWNER TO school_erp;

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_elective boolean DEFAULT false NOT NULL,
    elective_group character varying(50),
    deleted_at timestamp with time zone
);


ALTER TABLE public.subjects OWNER TO school_erp;

--
-- Name: succession_plans; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.succession_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    position_employee_id uuid NOT NULL,
    successor_employee_id uuid,
    readiness_level public.succession_plans_readiness_level_enum,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.succession_plans OWNER TO school_erp;

--
-- Name: teacher_subject_specializations; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.teacher_subject_specializations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teacher_subject_specializations OWNER TO school_erp;

--
-- Name: tenant_feature_toggles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.tenant_feature_toggles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    feature_key character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_feature_toggles OWNER TO school_erp;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_name character varying(200) NOT NULL,
    subdomain character varying(63) NOT NULL,
    logo_url character varying,
    primary_color character varying(7) DEFAULT '#0D9488'::character varying NOT NULL,
    status public.tenants_status_enum DEFAULT 'provisioning'::public.tenants_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenants OWNER TO school_erp;

--
-- Name: timetable_slots; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.timetable_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    school_class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    day_of_week public.timetable_slots_day_of_week_enum NOT NULL,
    period_number integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.timetable_slots OWNER TO school_erp;

--
-- Name: users; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid,
    role_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(254) NOT NULL,
    phone character varying(32),
    auth_provider public.users_auth_provider_enum DEFAULT 'local'::public.users_auth_provider_enum NOT NULL,
    password_hash character varying,
    status public.users_status_enum DEFAULT 'invited'::public.users_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    student_id uuid
);


ALTER TABLE public.users OWNER TO school_erp;

--
-- Name: vehicle_maintenance_records; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.vehicle_maintenance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    maintenance_type public.vehicle_maintenance_records_type_enum NOT NULL,
    description text NOT NULL,
    scheduled_date date NOT NULL,
    completed_date date,
    cost numeric,
    vendor_name character varying(200),
    status public.vehicle_maintenance_records_status_enum DEFAULT 'scheduled'::public.vehicle_maintenance_records_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vehicle_maintenance_records OWNER TO school_erp;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: school_erp
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    campus_id uuid NOT NULL,
    registration_number character varying(20) NOT NULL,
    model character varying(100),
    capacity integer NOT NULL,
    status public.vehicles_status_enum DEFAULT 'active'::public.vehicles_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vehicles OWNER TO school_erp;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: academic_years PK_academic_years; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT "PK_academic_years" PRIMARY KEY (id);


--
-- Name: activities PK_activities; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "PK_activities" PRIMARY KEY (id);


--
-- Name: activity_rosters PK_activity_rosters; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.activity_rosters
    ADD CONSTRAINT "PK_activity_rosters" PRIMARY KEY (id);


--
-- Name: admissions PK_admissions; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT "PK_admissions" PRIMARY KEY (id);


--
-- Name: alumni_event_registrations PK_alumni_event_registrations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.alumni_event_registrations
    ADD CONSTRAINT "PK_alumni_event_registrations" PRIMARY KEY (id);


--
-- Name: alumni_events PK_alumni_events; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.alumni_events
    ADD CONSTRAINT "PK_alumni_events" PRIMARY KEY (id);


--
-- Name: alumni_profiles PK_alumni_profiles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.alumni_profiles
    ADD CONSTRAINT "PK_alumni_profiles" PRIMARY KEY (id);


--
-- Name: applicants PK_applicants; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT "PK_applicants" PRIMARY KEY (id);


--
-- Name: asset_tags PK_asset_tags; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.asset_tags
    ADD CONSTRAINT "PK_asset_tags" PRIMARY KEY (id);


--
-- Name: assignment_submissions PK_assignment_submissions; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT "PK_assignment_submissions" PRIMARY KEY (id);


--
-- Name: assignments PK_assignments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "PK_assignments" PRIMARY KEY (id);


--
-- Name: attendance_records PK_attendance_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "PK_attendance_records" PRIMARY KEY (id);


--
-- Name: awards PK_awards; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT "PK_awards" PRIMARY KEY (id);


--
-- Name: behavior_incidents PK_behavior_incidents; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.behavior_incidents
    ADD CONSTRAINT "PK_behavior_incidents" PRIMARY KEY (id);


--
-- Name: book_copies PK_book_copies; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_copies
    ADD CONSTRAINT "PK_book_copies" PRIMARY KEY (id);


--
-- Name: book_issues PK_book_issues; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "PK_book_issues" PRIMARY KEY (id);


--
-- Name: book_reservations PK_book_reservations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT "PK_book_reservations" PRIMARY KEY (id);


--
-- Name: books PK_books; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT "PK_books" PRIMARY KEY (id);


--
-- Name: campuses PK_campuses; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.campuses
    ADD CONSTRAINT "PK_campuses" PRIMARY KEY (id);


--
-- Name: certificates PK_certificates; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "PK_certificates" PRIMARY KEY (id);


--
-- Name: circular_read_receipts PK_circular_read_receipts; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circular_read_receipts
    ADD CONSTRAINT "PK_circular_read_receipts" PRIMARY KEY (id);


--
-- Name: circulars PK_circulars; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circulars
    ADD CONSTRAINT "PK_circulars" PRIMARY KEY (id);


--
-- Name: class_elective_offerings PK_class_elective_offerings; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.class_elective_offerings
    ADD CONSTRAINT "PK_class_elective_offerings" PRIMARY KEY (id);


--
-- Name: clinic_visits PK_clinic_visits; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.clinic_visits
    ADD CONSTRAINT "PK_clinic_visits" PRIMARY KEY (id);


--
-- Name: corrective_actions PK_corrective_actions; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.corrective_actions
    ADD CONSTRAINT "PK_corrective_actions" PRIMARY KEY (id);


--
-- Name: counseling_referrals PK_counseling_referrals; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.counseling_referrals
    ADD CONSTRAINT "PK_counseling_referrals" PRIMARY KEY (id);


--
-- Name: daily_menu_items PK_daily_menu_items; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menu_items
    ADD CONSTRAINT "PK_daily_menu_items" PRIMARY KEY (id);


--
-- Name: daily_menus PK_daily_menus; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menus
    ADD CONSTRAINT "PK_daily_menus" PRIMARY KEY (id);


--
-- Name: diary_entries PK_diary_entries; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT "PK_diary_entries" PRIMARY KEY (id);


--
-- Name: diary_replies PK_diary_replies; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.diary_replies
    ADD CONSTRAINT "PK_diary_replies" PRIMARY KEY (id);


--
-- Name: discussion_posts PK_discussion_posts; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT "PK_discussion_posts" PRIMARY KEY (id);


--
-- Name: discussion_threads PK_discussion_threads; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.discussion_threads
    ADD CONSTRAINT "PK_discussion_threads" PRIMARY KEY (id);


--
-- Name: document_acknowledgments PK_document_acknowledgments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.document_acknowledgments
    ADD CONSTRAINT "PK_document_acknowledgments" PRIMARY KEY (id);


--
-- Name: documents PK_documents; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "PK_documents" PRIMARY KEY (id);


--
-- Name: donations PK_donations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT "PK_donations" PRIMARY KEY (id);


--
-- Name: drivers PK_drivers; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "PK_drivers" PRIMARY KEY (id);


--
-- Name: employees PK_employees; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "PK_employees" PRIMARY KEY (id);


--
-- Name: event_registrations PK_event_registrations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "PK_event_registrations" PRIMARY KEY (id);


--
-- Name: events PK_events; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "PK_events" PRIMARY KEY (id);


--
-- Name: exam_groups PK_exam_groups; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_groups
    ADD CONSTRAINT "PK_exam_groups" PRIMARY KEY (id);


--
-- Name: exam_results PK_exam_results; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT "PK_exam_results" PRIMARY KEY (id);


--
-- Name: exams PK_exams; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "PK_exams" PRIMARY KEY (id);


--
-- Name: fee_adjustments PK_fee_adjustments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT "PK_fee_adjustments" PRIMARY KEY (id);


--
-- Name: fee_assignments PK_fee_assignments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_assignments
    ADD CONSTRAINT "PK_fee_assignments" PRIMARY KEY (id);


--
-- Name: fee_components PK_fee_components; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_components
    ADD CONSTRAINT "PK_fee_components" PRIMARY KEY (id);


--
-- Name: fee_installments PK_fee_installments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_installments
    ADD CONSTRAINT "PK_fee_installments" PRIMARY KEY (id);


--
-- Name: fee_payments PK_fee_payments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT "PK_fee_payments" PRIMARY KEY (id);


--
-- Name: fee_structures PK_fee_structures; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT "PK_fee_structures" PRIMARY KEY (id);


--
-- Name: full_final_settlements PK_full_final_settlements; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.full_final_settlements
    ADD CONSTRAINT "PK_full_final_settlements" PRIMARY KEY (id);


--
-- Name: hostel_attendance_records PK_hostel_attendance_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_attendance_records
    ADD CONSTRAINT "PK_hostel_attendance_records" PRIMARY KEY (id);


--
-- Name: hostel_maintenance_requests PK_hostel_maintenance_requests; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_maintenance_requests
    ADD CONSTRAINT "PK_hostel_maintenance_requests" PRIMARY KEY (id);


--
-- Name: hostel_room_allocations PK_hostel_room_allocations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_room_allocations
    ADD CONSTRAINT "PK_hostel_room_allocations" PRIMARY KEY (id);


--
-- Name: hostel_room_preferences PK_hostel_room_preferences; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_room_preferences
    ADD CONSTRAINT "PK_hostel_room_preferences" PRIMARY KEY (id);


--
-- Name: hostel_rooms PK_hostel_rooms; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_rooms
    ADD CONSTRAINT "PK_hostel_rooms" PRIMARY KEY (id);


--
-- Name: hostel_visitors PK_hostel_visitors; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_visitors
    ADD CONSTRAINT "PK_hostel_visitors" PRIMARY KEY (id);


--
-- Name: immunization_records PK_immunization_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.immunization_records
    ADD CONSTRAINT "PK_immunization_records" PRIMARY KEY (id);


--
-- Name: item_stocks PK_item_stocks; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.item_stocks
    ADD CONSTRAINT "PK_item_stocks" PRIMARY KEY (id);


--
-- Name: items PK_items; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "PK_items" PRIMARY KEY (id);


--
-- Name: job_openings PK_job_openings; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.job_openings
    ADD CONSTRAINT "PK_job_openings" PRIMARY KEY (id);


--
-- Name: learning_resources PK_learning_resources; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT "PK_learning_resources" PRIMARY KEY (id);


--
-- Name: leave_requests PK_leave_requests; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "PK_leave_requests" PRIMARY KEY (id);


--
-- Name: lecture_progress PK_lecture_progress; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.lecture_progress
    ADD CONSTRAINT "PK_lecture_progress" PRIMARY KEY (id);


--
-- Name: lectures PK_lectures; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.lectures
    ADD CONSTRAINT "PK_lectures" PRIMARY KEY (id);


--
-- Name: loan_advances PK_loan_advances; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.loan_advances
    ADD CONSTRAINT "PK_loan_advances" PRIMARY KEY (id);


--
-- Name: meal_attendance_records PK_meal_attendance_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.meal_attendance_records
    ADD CONSTRAINT "PK_meal_attendance_records" PRIMARY KEY (id);


--
-- Name: medication_administrations PK_medication_administrations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.medication_administrations
    ADD CONSTRAINT "PK_medication_administrations" PRIMARY KEY (id);


--
-- Name: mentorship_matches PK_mentorship_matches; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.mentorship_matches
    ADD CONSTRAINT "PK_mentorship_matches" PRIMARY KEY (id);


--
-- Name: menu_items PK_menu_items; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "PK_menu_items" PRIMARY KEY (id);


--
-- Name: parent_student_links PK_parent_student_links; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT "PK_parent_student_links" PRIMARY KEY (id);


--
-- Name: payroll_runs PK_payroll_runs; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT "PK_payroll_runs" PRIMARY KEY (id);


--
-- Name: payroll_settings PK_payroll_settings; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payroll_settings
    ADD CONSTRAINT "PK_payroll_settings" PRIMARY KEY (id);


--
-- Name: payslips PK_payslips; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT "PK_payslips" PRIMARY KEY (id);


--
-- Name: performance_review_cycles PK_performance_review_cycles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.performance_review_cycles
    ADD CONSTRAINT "PK_performance_review_cycles" PRIMARY KEY (id);


--
-- Name: performance_reviews PK_performance_reviews; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT "PK_performance_reviews" PRIMARY KEY (id);


--
-- Name: procurement_requests PK_procurement_requests; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT "PK_procurement_requests" PRIMARY KEY (id);


--
-- Name: roles PK_roles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_roles" PRIMARY KEY (id);


--
-- Name: route_assignments PK_route_assignments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_assignments
    ADD CONSTRAINT "PK_route_assignments" PRIMARY KEY (id);


--
-- Name: route_stops PK_route_stops; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT "PK_route_stops" PRIMARY KEY (id);


--
-- Name: routes PK_routes; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT "PK_routes" PRIMARY KEY (id);


--
-- Name: salary_structures PK_salary_structures; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT "PK_salary_structures" PRIMARY KEY (id);


--
-- Name: school_classes PK_school_classes; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT "PK_school_classes" PRIMARY KEY (id);


--
-- Name: screening_campaigns PK_screening_campaigns; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_campaigns
    ADD CONSTRAINT "PK_screening_campaigns" PRIMARY KEY (id);


--
-- Name: screening_results PK_screening_results; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT "PK_screening_results" PRIMARY KEY (id);


--
-- Name: staff_attendance_records PK_staff_attendance_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.staff_attendance_records
    ADD CONSTRAINT "PK_staff_attendance_records" PRIMARY KEY (id);


--
-- Name: staff_certifications PK_staff_certifications; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.staff_certifications
    ADD CONSTRAINT "PK_staff_certifications" PRIMARY KEY (id);


--
-- Name: stock_transactions PK_stock_transactions; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "PK_stock_transactions" PRIMARY KEY (id);


--
-- Name: student_dietary_restrictions PK_student_dietary_restrictions; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_dietary_restrictions
    ADD CONSTRAINT "PK_student_dietary_restrictions" PRIMARY KEY (id);


--
-- Name: student_elective_selections PK_student_elective_selections; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_elective_selections
    ADD CONSTRAINT "PK_student_elective_selections" PRIMARY KEY (id);


--
-- Name: student_health_profiles PK_student_health_profiles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_health_profiles
    ADD CONSTRAINT "PK_student_health_profiles" PRIMARY KEY (id);


--
-- Name: student_transport_assignments PK_student_transport_assignments; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_transport_assignments
    ADD CONSTRAINT "PK_student_transport_assignments" PRIMARY KEY (id);


--
-- Name: students PK_students; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "PK_students" PRIMARY KEY (id);


--
-- Name: subjects PK_subjects; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "PK_subjects" PRIMARY KEY (id);


--
-- Name: succession_plans PK_succession_plans; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.succession_plans
    ADD CONSTRAINT "PK_succession_plans" PRIMARY KEY (id);


--
-- Name: teacher_subject_specializations PK_teacher_subject_specializations; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.teacher_subject_specializations
    ADD CONSTRAINT "PK_teacher_subject_specializations" PRIMARY KEY (id);


--
-- Name: tenant_feature_toggles PK_tenant_feature_toggles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.tenant_feature_toggles
    ADD CONSTRAINT "PK_tenant_feature_toggles" PRIMARY KEY (id);


--
-- Name: tenants PK_tenants; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "PK_tenants" PRIMARY KEY (id);


--
-- Name: timetable_slots PK_timetable_slots; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT "PK_timetable_slots" PRIMARY KEY (id);


--
-- Name: users PK_users; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY (id);


--
-- Name: vehicle_maintenance_records PK_vehicle_maintenance_records; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.vehicle_maintenance_records
    ADD CONSTRAINT "PK_vehicle_maintenance_records" PRIMARY KEY (id);


--
-- Name: vehicles PK_vehicles; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_vehicles" PRIMARY KEY (id);


--
-- Name: activity_rosters UQ_activity_rosters_activity_student; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.activity_rosters
    ADD CONSTRAINT "UQ_activity_rosters_activity_student" UNIQUE (activity_id, student_id);


--
-- Name: alumni_event_registrations UQ_alumni_event_registrations_event_alumni; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.alumni_event_registrations
    ADD CONSTRAINT "UQ_alumni_event_registrations_event_alumni" UNIQUE (event_id, alumni_id);


--
-- Name: alumni_profiles UQ_alumni_profiles_student; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.alumni_profiles
    ADD CONSTRAINT "UQ_alumni_profiles_student" UNIQUE (tenant_id, student_id);


--
-- Name: class_elective_offerings UQ_class_elective_offerings_tenant_class_subject; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.class_elective_offerings
    ADD CONSTRAINT "UQ_class_elective_offerings_tenant_class_subject" UNIQUE (tenant_id, school_class_id, subject_id);


--
-- Name: document_acknowledgments UQ_document_acknowledgments_doc_user; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.document_acknowledgments
    ADD CONSTRAINT "UQ_document_acknowledgments_doc_user" UNIQUE (tenant_id, document_id, acknowledged_by);


--
-- Name: event_registrations UQ_event_registrations_event_student; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "UQ_event_registrations_event_student" UNIQUE (event_id, student_id);


--
-- Name: hostel_attendance_records UQ_hostel_attendance_records_student_date; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_attendance_records
    ADD CONSTRAINT "UQ_hostel_attendance_records_student_date" UNIQUE (tenant_id, student_id, date);


--
-- Name: hostel_rooms UQ_hostel_rooms_unit; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.hostel_rooms
    ADD CONSTRAINT "UQ_hostel_rooms_unit" UNIQUE (tenant_id, campus_id, building_name, room_number);


--
-- Name: parent_student_links UQ_parent_student_links_tenant_parent_student; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT "UQ_parent_student_links_tenant_parent_student" UNIQUE (tenant_id, parent_user_id, student_id);


--
-- Name: payroll_runs UQ_payroll_runs_period; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT "UQ_payroll_runs_period" UNIQUE (tenant_id, month, year);


--
-- Name: payroll_settings UQ_payroll_settings_tenant; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payroll_settings
    ADD CONSTRAINT "UQ_payroll_settings_tenant" UNIQUE (tenant_id);


--
-- Name: payslips UQ_payslips_run_employee; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT "UQ_payslips_run_employee" UNIQUE (payroll_run_id, employee_id);


--
-- Name: staff_attendance_records UQ_staff_attendance_employee_date; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.staff_attendance_records
    ADD CONSTRAINT "UQ_staff_attendance_employee_date" UNIQUE (tenant_id, employee_id, date);


--
-- Name: student_elective_selections UQ_student_elective_selections_tenant_student_subject_year; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_elective_selections
    ADD CONSTRAINT "UQ_student_elective_selections_tenant_student_subject_year" UNIQUE (tenant_id, student_id, subject_id, academic_year_id);


--
-- Name: tenant_feature_toggles UQ_tenant_feature_toggles_tenant_key; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.tenant_feature_toggles
    ADD CONSTRAINT "UQ_tenant_feature_toggles_tenant_key" UNIQUE (tenant_id, feature_key);


--
-- Name: tenants UQ_tenants_subdomain; Type: CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "UQ_tenants_subdomain" UNIQUE (subdomain);


--
-- Name: IDX_asset_tags_tenant_item; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_asset_tags_tenant_item" ON public.asset_tags USING btree (tenant_id, item_id);


--
-- Name: IDX_asset_tags_tenant_status; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_asset_tags_tenant_status" ON public.asset_tags USING btree (tenant_id, status);


--
-- Name: IDX_assignments_tenant_class; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_assignments_tenant_class" ON public.assignments USING btree (tenant_id, school_class_id);


--
-- Name: IDX_attendance_records_class_student_date; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_attendance_records_class_student_date" ON public.attendance_records USING btree (tenant_id, school_class_id, student_id, date);


--
-- Name: IDX_book_copies_tenant_book; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_copies_tenant_book" ON public.book_copies USING btree (tenant_id, book_id);


--
-- Name: IDX_book_copies_tenant_status; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_copies_tenant_status" ON public.book_copies USING btree (tenant_id, status);


--
-- Name: IDX_book_issues_tenant_copy_return; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_issues_tenant_copy_return" ON public.book_issues USING btree (tenant_id, book_copy_id, return_date);


--
-- Name: IDX_book_issues_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_issues_tenant_student" ON public.book_issues USING btree (tenant_id, student_id);


--
-- Name: IDX_book_reservations_tenant_book_status; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_reservations_tenant_book_status" ON public.book_reservations USING btree (tenant_id, book_id, status);


--
-- Name: IDX_book_reservations_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_book_reservations_tenant_student" ON public.book_reservations USING btree (tenant_id, student_id);


--
-- Name: IDX_books_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_books_tenant" ON public.books USING btree (tenant_id);


--
-- Name: IDX_circular_read_receipts_circular_user; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_circular_read_receipts_circular_user" ON public.circular_read_receipts USING btree (circular_id, user_id);


--
-- Name: IDX_cv_tenant_date; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_cv_tenant_date" ON public.clinic_visits USING btree (tenant_id, visit_date);


--
-- Name: IDX_cv_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_cv_tenant_student" ON public.clinic_visits USING btree (tenant_id, student_id);


--
-- Name: IDX_diary_entries_class; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_diary_entries_class" ON public.diary_entries USING btree (class_id);


--
-- Name: IDX_diary_entries_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_diary_entries_student" ON public.diary_entries USING btree (student_id);


--
-- Name: IDX_diary_entries_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_diary_entries_tenant" ON public.diary_entries USING btree (tenant_id);


--
-- Name: IDX_diary_replies_entry; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_diary_replies_entry" ON public.diary_replies USING btree (diary_entry_id);


--
-- Name: IDX_diary_replies_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_diary_replies_tenant" ON public.diary_replies USING btree (tenant_id);


--
-- Name: IDX_discussion_posts_thread; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_discussion_posts_thread" ON public.discussion_posts USING btree (thread_id);


--
-- Name: IDX_discussion_threads_tenant_class; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_discussion_threads_tenant_class" ON public.discussion_threads USING btree (tenant_id, school_class_id);


--
-- Name: IDX_drivers_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_drivers_tenant" ON public.drivers USING btree (tenant_id);


--
-- Name: IDX_exam_results_exam_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_exam_results_exam_student" ON public.exam_results USING btree (tenant_id, exam_id, student_id);


--
-- Name: IDX_exams_exam_group_id; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_exams_exam_group_id" ON public.exams USING btree (exam_group_id);


--
-- Name: IDX_fee_assignments_tenant_student_structure; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_fee_assignments_tenant_student_structure" ON public.fee_assignments USING btree (tenant_id, student_id, fee_structure_id);


--
-- Name: IDX_fee_structures_tenant_year_grade; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_fee_structures_tenant_year_grade" ON public.fee_structures USING btree (tenant_id, academic_year_id, grade_level);


--
-- Name: IDX_ir_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_ir_tenant_student" ON public.immunization_records USING btree (tenant_id, student_id);


--
-- Name: IDX_items_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_items_tenant" ON public.items USING btree (tenant_id);


--
-- Name: IDX_items_tenant_category; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_items_tenant_category" ON public.items USING btree (tenant_id, category);


--
-- Name: IDX_learning_resources_tenant_class; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_learning_resources_tenant_class" ON public.learning_resources USING btree (tenant_id, school_class_id);


--
-- Name: IDX_lectures_tenant_class; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_lectures_tenant_class" ON public.lectures USING btree (tenant_id, school_class_id);


--
-- Name: IDX_ma_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_ma_tenant_student" ON public.medication_administrations USING btree (tenant_id, student_id);


--
-- Name: IDX_mar_tenant_date_type; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_mar_tenant_date_type" ON public.meal_attendance_records USING btree (tenant_id, attendance_date, meal_type);


--
-- Name: IDX_menu_items_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_menu_items_tenant" ON public.menu_items USING btree (tenant_id);


--
-- Name: IDX_pr_tenant_status; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_pr_tenant_status" ON public.procurement_requests USING btree (tenant_id, status);


--
-- Name: IDX_route_assignments_tenant_driver; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_route_assignments_tenant_driver" ON public.route_assignments USING btree (tenant_id, driver_id);


--
-- Name: IDX_route_assignments_tenant_vehicle; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_route_assignments_tenant_vehicle" ON public.route_assignments USING btree (tenant_id, vehicle_id);


--
-- Name: IDX_route_stops_tenant_route; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_route_stops_tenant_route" ON public.route_stops USING btree (tenant_id, route_id);


--
-- Name: IDX_routes_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_routes_tenant" ON public.routes USING btree (tenant_id);


--
-- Name: IDX_sc_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_sc_tenant" ON public.screening_campaigns USING btree (tenant_id);


--
-- Name: IDX_school_classes_tenant_year_grade_section; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_school_classes_tenant_year_grade_section" ON public.school_classes USING btree (tenant_id, academic_year_id, grade_level, section);


--
-- Name: IDX_sdr_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_sdr_tenant_student" ON public.student_dietary_restrictions USING btree (tenant_id, student_id);


--
-- Name: IDX_sr_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_sr_tenant_student" ON public.screening_results USING btree (tenant_id, student_id);


--
-- Name: IDX_st_tenant_item_campus; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_st_tenant_item_campus" ON public.stock_transactions USING btree (tenant_id, item_id, campus_id);


--
-- Name: IDX_sta_tenant_route; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_sta_tenant_route" ON public.student_transport_assignments USING btree (tenant_id, route_id);


--
-- Name: IDX_students_class_roll_number; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_students_class_roll_number" ON public.students USING btree (tenant_id, school_class_id, roll_number) WHERE ((school_class_id IS NOT NULL) AND (roll_number IS NOT NULL));


--
-- Name: IDX_students_tenant_admission_number; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_students_tenant_admission_number" ON public.students USING btree (tenant_id, admission_number);


--
-- Name: IDX_subjects_not_deleted; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_subjects_not_deleted" ON public.subjects USING btree (tenant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_subjects_tenant_code; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_subjects_tenant_code" ON public.subjects USING btree (tenant_id, code);


--
-- Name: IDX_timetable_slots_class_day_period_subject; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_timetable_slots_class_day_period_subject" ON public.timetable_slots USING btree (tenant_id, school_class_id, day_of_week, period_number, subject_id);


--
-- Name: IDX_tss_tenant_teacher; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_tss_tenant_teacher" ON public.teacher_subject_specializations USING btree (tenant_id, teacher_id);


--
-- Name: IDX_users_tenant_email; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "IDX_users_tenant_email" ON public.users USING btree (tenant_id, email);


--
-- Name: IDX_vehicles_tenant; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE INDEX "IDX_vehicles_tenant" ON public.vehicles USING btree (tenant_id);


--
-- Name: UQ_asset_tags_tenant_number; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_asset_tags_tenant_number" ON public.asset_tags USING btree (tenant_id, asset_tag_number);


--
-- Name: UQ_book_copies_tenant_barcode; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_book_copies_tenant_barcode" ON public.book_copies USING btree (tenant_id, barcode);


--
-- Name: UQ_daily_menus_tenant_date_type; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_daily_menus_tenant_date_type" ON public.daily_menus USING btree (tenant_id, menu_date, meal_type);


--
-- Name: UQ_dmi_tenant_menu_item; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_dmi_tenant_menu_item" ON public.daily_menu_items USING btree (tenant_id, daily_menu_id, menu_item_id);


--
-- Name: UQ_item_stocks_tenant_item_campus; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_item_stocks_tenant_item_campus" ON public.item_stocks USING btree (tenant_id, item_id, campus_id);


--
-- Name: UQ_lecture_progress_lecture_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_lecture_progress_lecture_student" ON public.lecture_progress USING btree (tenant_id, lecture_id, student_id);


--
-- Name: UQ_mar_tenant_date_type_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_mar_tenant_date_type_student" ON public.meal_attendance_records USING btree (tenant_id, attendance_date, meal_type, student_id);


--
-- Name: UQ_route_assignments_tenant_route_year; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_route_assignments_tenant_route_year" ON public.route_assignments USING btree (tenant_id, route_id, academic_year_id);


--
-- Name: UQ_route_stops_tenant_route_seq; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_route_stops_tenant_route_seq" ON public.route_stops USING btree (tenant_id, route_id, sequence_order);


--
-- Name: UQ_shp_tenant_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_shp_tenant_student" ON public.student_health_profiles USING btree (tenant_id, student_id);


--
-- Name: UQ_sr_tenant_campaign_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_sr_tenant_campaign_student" ON public.screening_results USING btree (tenant_id, campaign_id, student_id);


--
-- Name: UQ_sta_tenant_student_year; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_sta_tenant_student_year" ON public.student_transport_assignments USING btree (tenant_id, student_id, academic_year_id);


--
-- Name: UQ_submissions_assignment_student; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_submissions_assignment_student" ON public.assignment_submissions USING btree (tenant_id, assignment_id, student_id);


--
-- Name: UQ_users_student_id; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_users_student_id" ON public.users USING btree (student_id) WHERE (student_id IS NOT NULL);


--
-- Name: UQ_vehicles_tenant_reg; Type: INDEX; Schema: public; Owner: school_erp
--

CREATE UNIQUE INDEX "UQ_vehicles_tenant_reg" ON public.vehicles USING btree (tenant_id, registration_number);


--
-- Name: academic_years FK_academic_years_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT "FK_academic_years_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: admissions FK_admissions_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT "FK_admissions_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: admissions FK_admissions_campus; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT "FK_admissions_campus" FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE RESTRICT;


--
-- Name: admissions FK_admissions_enrolled_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT "FK_admissions_enrolled_student" FOREIGN KEY (enrolled_student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: admissions FK_admissions_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT "FK_admissions_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: asset_tags FK_asset_tags_item; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.asset_tags
    ADD CONSTRAINT "FK_asset_tags_item" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: asset_tags FK_asset_tags_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.asset_tags
    ADD CONSTRAINT "FK_asset_tags_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: attendance_records FK_attendance_records_class; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "FK_attendance_records_class" FOREIGN KEY (school_class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE;


--
-- Name: attendance_records FK_attendance_records_marked_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "FK_attendance_records_marked_by" FOREIGN KEY (marked_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: attendance_records FK_attendance_records_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "FK_attendance_records_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: attendance_records FK_attendance_records_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "FK_attendance_records_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: book_copies FK_book_copies_book; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_copies
    ADD CONSTRAINT "FK_book_copies_book" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_copies FK_book_copies_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_copies
    ADD CONSTRAINT "FK_book_copies_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: book_issues FK_book_issues_book_copy; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "FK_book_issues_book_copy" FOREIGN KEY (book_copy_id) REFERENCES public.book_copies(id) ON DELETE RESTRICT;


--
-- Name: book_issues FK_book_issues_issued_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "FK_book_issues_issued_by" FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: book_issues FK_book_issues_returned_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "FK_book_issues_returned_by" FOREIGN KEY (returned_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: book_issues FK_book_issues_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "FK_book_issues_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: book_issues FK_book_issues_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_issues
    ADD CONSTRAINT "FK_book_issues_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: book_reservations FK_book_reservations_book; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT "FK_book_reservations_book" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_reservations FK_book_reservations_fulfilled_copy; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT "FK_book_reservations_fulfilled_copy" FOREIGN KEY (fulfilled_book_copy_id) REFERENCES public.book_copies(id) ON DELETE SET NULL;


--
-- Name: book_reservations FK_book_reservations_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT "FK_book_reservations_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: book_reservations FK_book_reservations_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT "FK_book_reservations_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: books FK_books_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT "FK_books_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: campuses FK_campuses_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.campuses
    ADD CONSTRAINT "FK_campuses_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: circular_read_receipts FK_circular_read_receipts_circular; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circular_read_receipts
    ADD CONSTRAINT "FK_circular_read_receipts_circular" FOREIGN KEY (circular_id) REFERENCES public.circulars(id) ON DELETE CASCADE;


--
-- Name: circular_read_receipts FK_circular_read_receipts_user; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circular_read_receipts
    ADD CONSTRAINT "FK_circular_read_receipts_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: circulars FK_circulars_class; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circulars
    ADD CONSTRAINT "FK_circulars_class" FOREIGN KEY (audience_school_class_id) REFERENCES public.school_classes(id) ON DELETE SET NULL;


--
-- Name: circulars FK_circulars_published_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circulars
    ADD CONSTRAINT "FK_circulars_published_by" FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: circulars FK_circulars_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.circulars
    ADD CONSTRAINT "FK_circulars_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: clinic_visits FK_cv_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.clinic_visits
    ADD CONSTRAINT "FK_cv_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: clinic_visits FK_cv_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.clinic_visits
    ADD CONSTRAINT "FK_cv_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: clinic_visits FK_cv_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.clinic_visits
    ADD CONSTRAINT "FK_cv_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: daily_menus FK_daily_menus_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menus
    ADD CONSTRAINT "FK_daily_menus_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: diary_replies FK_diary_replies_entry; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.diary_replies
    ADD CONSTRAINT "FK_diary_replies_entry" FOREIGN KEY (diary_entry_id) REFERENCES public.diary_entries(id) ON DELETE CASCADE;


--
-- Name: discussion_posts FK_discussion_posts_thread; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT "FK_discussion_posts_thread" FOREIGN KEY (thread_id) REFERENCES public.discussion_threads(id) ON DELETE CASCADE;


--
-- Name: daily_menu_items FK_dmi_daily_menu; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menu_items
    ADD CONSTRAINT "FK_dmi_daily_menu" FOREIGN KEY (daily_menu_id) REFERENCES public.daily_menus(id) ON DELETE CASCADE;


--
-- Name: daily_menu_items FK_dmi_menu_item; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menu_items
    ADD CONSTRAINT "FK_dmi_menu_item" FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: daily_menu_items FK_dmi_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.daily_menu_items
    ADD CONSTRAINT "FK_dmi_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: drivers FK_drivers_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "FK_drivers_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: exam_groups FK_exam_groups_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_groups
    ADD CONSTRAINT "FK_exam_groups_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: exam_results FK_exam_results_entered_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT "FK_exam_results_entered_by" FOREIGN KEY (entered_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: exam_results FK_exam_results_exam; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT "FK_exam_results_exam" FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_results FK_exam_results_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT "FK_exam_results_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: exam_results FK_exam_results_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT "FK_exam_results_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: exams FK_exams_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: exams FK_exams_class; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_class" FOREIGN KEY (school_class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE;


--
-- Name: exams FK_exams_created_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: exams FK_exams_exam_group; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_exam_group" FOREIGN KEY (exam_group_id) REFERENCES public.exam_groups(id) ON DELETE SET NULL;


--
-- Name: exams FK_exams_subject; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_subject" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;


--
-- Name: exams FK_exams_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT "FK_exams_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fee_adjustments FK_fee_adjustments_assignment; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT "FK_fee_adjustments_assignment" FOREIGN KEY (fee_assignment_id) REFERENCES public.fee_assignments(id) ON DELETE CASCADE;


--
-- Name: fee_adjustments FK_fee_adjustments_created_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT "FK_fee_adjustments_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: fee_adjustments FK_fee_adjustments_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT "FK_fee_adjustments_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fee_assignments FK_fee_assignments_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_assignments
    ADD CONSTRAINT "FK_fee_assignments_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: fee_assignments FK_fee_assignments_structure; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_assignments
    ADD CONSTRAINT "FK_fee_assignments_structure" FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id) ON DELETE RESTRICT;


--
-- Name: fee_assignments FK_fee_assignments_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_assignments
    ADD CONSTRAINT "FK_fee_assignments_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: fee_assignments FK_fee_assignments_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_assignments
    ADD CONSTRAINT "FK_fee_assignments_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fee_components FK_fee_components_structure; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_components
    ADD CONSTRAINT "FK_fee_components_structure" FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id) ON DELETE CASCADE;


--
-- Name: fee_installments FK_fee_installments_structure; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_installments
    ADD CONSTRAINT "FK_fee_installments_structure" FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id) ON DELETE CASCADE;


--
-- Name: fee_payments FK_fee_payments_assignment; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT "FK_fee_payments_assignment" FOREIGN KEY (fee_assignment_id) REFERENCES public.fee_assignments(id) ON DELETE CASCADE;


--
-- Name: fee_payments FK_fee_payments_installment; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT "FK_fee_payments_installment" FOREIGN KEY (fee_installment_id) REFERENCES public.fee_installments(id) ON DELETE SET NULL;


--
-- Name: fee_payments FK_fee_payments_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT "FK_fee_payments_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: fee_payments FK_fee_payments_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT "FK_fee_payments_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fee_structures FK_fee_structures_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT "FK_fee_structures_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: fee_structures FK_fee_structures_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT "FK_fee_structures_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: immunization_records FK_ir_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.immunization_records
    ADD CONSTRAINT "FK_ir_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: immunization_records FK_ir_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.immunization_records
    ADD CONSTRAINT "FK_ir_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: immunization_records FK_ir_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.immunization_records
    ADD CONSTRAINT "FK_ir_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: item_stocks FK_item_stocks_item; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.item_stocks
    ADD CONSTRAINT "FK_item_stocks_item" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: item_stocks FK_item_stocks_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.item_stocks
    ADD CONSTRAINT "FK_item_stocks_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: items FK_items_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "FK_items_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: lecture_progress FK_lecture_progress_lecture; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.lecture_progress
    ADD CONSTRAINT "FK_lecture_progress_lecture" FOREIGN KEY (lecture_id) REFERENCES public.lectures(id) ON DELETE CASCADE;


--
-- Name: medication_administrations FK_ma_administered_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.medication_administrations
    ADD CONSTRAINT "FK_ma_administered_by" FOREIGN KEY (administered_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: medication_administrations FK_ma_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.medication_administrations
    ADD CONSTRAINT "FK_ma_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: medication_administrations FK_ma_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.medication_administrations
    ADD CONSTRAINT "FK_ma_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: meal_attendance_records FK_mar_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.meal_attendance_records
    ADD CONSTRAINT "FK_mar_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: meal_attendance_records FK_mar_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.meal_attendance_records
    ADD CONSTRAINT "FK_mar_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: meal_attendance_records FK_mar_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.meal_attendance_records
    ADD CONSTRAINT "FK_mar_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: menu_items FK_menu_items_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "FK_menu_items_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: procurement_requests FK_pr_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT "FK_pr_approved_by" FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: procurement_requests FK_pr_item; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT "FK_pr_item" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- Name: procurement_requests FK_pr_requested_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT "FK_pr_requested_by" FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: procurement_requests FK_pr_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT "FK_pr_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: roles FK_roles_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "FK_roles_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: route_assignments FK_route_assignments_driver; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_assignments
    ADD CONSTRAINT "FK_route_assignments_driver" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE RESTRICT;


--
-- Name: route_assignments FK_route_assignments_route; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_assignments
    ADD CONSTRAINT "FK_route_assignments_route" FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


--
-- Name: route_assignments FK_route_assignments_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_assignments
    ADD CONSTRAINT "FK_route_assignments_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: route_assignments FK_route_assignments_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_assignments
    ADD CONSTRAINT "FK_route_assignments_vehicle" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- Name: route_stops FK_route_stops_route; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT "FK_route_stops_route" FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


--
-- Name: route_stops FK_route_stops_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT "FK_route_stops_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: routes FK_routes_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT "FK_routes_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: screening_campaigns FK_sc_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_campaigns
    ADD CONSTRAINT "FK_sc_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: school_classes FK_school_classes_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT "FK_school_classes_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: school_classes FK_school_classes_campus; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT "FK_school_classes_campus" FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE RESTRICT;


--
-- Name: school_classes FK_school_classes_teacher; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT "FK_school_classes_teacher" FOREIGN KEY (class_teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: school_classes FK_school_classes_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT "FK_school_classes_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: student_dietary_restrictions FK_sdr_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_dietary_restrictions
    ADD CONSTRAINT "FK_sdr_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: student_dietary_restrictions FK_sdr_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_dietary_restrictions
    ADD CONSTRAINT "FK_sdr_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: student_dietary_restrictions FK_sdr_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_dietary_restrictions
    ADD CONSTRAINT "FK_sdr_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: student_health_profiles FK_shp_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_health_profiles
    ADD CONSTRAINT "FK_shp_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: student_health_profiles FK_shp_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_health_profiles
    ADD CONSTRAINT "FK_shp_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: student_health_profiles FK_shp_updated_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_health_profiles
    ADD CONSTRAINT "FK_shp_updated_by" FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: screening_results FK_sr_campaign; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT "FK_sr_campaign" FOREIGN KEY (campaign_id) REFERENCES public.screening_campaigns(id) ON DELETE CASCADE;


--
-- Name: screening_results FK_sr_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT "FK_sr_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: screening_results FK_sr_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT "FK_sr_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: screening_results FK_sr_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT "FK_sr_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_transactions FK_st_item; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "FK_st_item" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- Name: stock_transactions FK_st_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "FK_st_recorded_by" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: stock_transactions FK_st_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "FK_st_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: student_transport_assignments FK_sta_route; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_transport_assignments
    ADD CONSTRAINT "FK_sta_route" FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE RESTRICT;


--
-- Name: student_transport_assignments FK_sta_stop; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_transport_assignments
    ADD CONSTRAINT "FK_sta_stop" FOREIGN KEY (stop_id) REFERENCES public.route_stops(id) ON DELETE RESTRICT;


--
-- Name: student_transport_assignments FK_sta_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_transport_assignments
    ADD CONSTRAINT "FK_sta_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: student_transport_assignments FK_sta_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.student_transport_assignments
    ADD CONSTRAINT "FK_sta_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: students FK_students_academic_year; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_students_academic_year" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;


--
-- Name: students FK_students_campus; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_students_campus" FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE RESTRICT;


--
-- Name: students FK_students_school_class; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_students_school_class" FOREIGN KEY (school_class_id) REFERENCES public.school_classes(id) ON DELETE SET NULL;


--
-- Name: students FK_students_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_students_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: subjects FK_subjects_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "FK_subjects_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions FK_submissions_assignment; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT "FK_submissions_assignment" FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: timetable_slots FK_timetable_slots_class; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT "FK_timetable_slots_class" FOREIGN KEY (school_class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE;


--
-- Name: timetable_slots FK_timetable_slots_subject; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT "FK_timetable_slots_subject" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;


--
-- Name: timetable_slots FK_timetable_slots_teacher; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT "FK_timetable_slots_teacher" FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: timetable_slots FK_timetable_slots_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT "FK_timetable_slots_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: teacher_subject_specializations FK_tss_subject; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.teacher_subject_specializations
    ADD CONSTRAINT "FK_tss_subject" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;


--
-- Name: teacher_subject_specializations FK_tss_teacher; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.teacher_subject_specializations
    ADD CONSTRAINT "FK_tss_teacher" FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_subject_specializations FK_tss_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.teacher_subject_specializations
    ADD CONSTRAINT "FK_tss_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: users FK_users_campus; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_users_campus" FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- Name: users FK_users_role; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_users_role" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: users FK_users_student; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_users_student" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: users FK_users_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vehicles FK_vehicles_tenant; Type: FK CONSTRAINT; Schema: public; Owner: school_erp
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_vehicles_tenant" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: academic_years; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_rosters; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.activity_rosters ENABLE ROW LEVEL SECURITY;

--
-- Name: admissions; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

--
-- Name: alumni_event_registrations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.alumni_event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: alumni_events; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;

--
-- Name: alumni_profiles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: applicants; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_tags; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: awards; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

--
-- Name: behavior_incidents; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.behavior_incidents ENABLE ROW LEVEL SECURITY;

--
-- Name: book_copies; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;

--
-- Name: book_issues; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;

--
-- Name: book_reservations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.book_reservations ENABLE ROW LEVEL SECURITY;

--
-- Name: books; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

--
-- Name: campuses; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: circulars; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

--
-- Name: class_elective_offerings; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.class_elective_offerings ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_visits; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: corrective_actions; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: counseling_referrals; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.counseling_referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_menu_items; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.daily_menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_menus; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;

--
-- Name: diary_entries; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: diary_replies; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.diary_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: discussion_posts; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: discussion_threads; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;

--
-- Name: document_acknowledgments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.document_acknowledgments ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: donations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

--
-- Name: drivers; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_groups; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.exam_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_results; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

--
-- Name: exams; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_adjustments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_assignments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_payments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_structures; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

--
-- Name: full_final_settlements; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.full_final_settlements ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_attendance_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_maintenance_requests; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_maintenance_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_room_allocations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_room_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_room_preferences; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_room_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_rooms; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: hostel_visitors; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.hostel_visitors ENABLE ROW LEVEL SECURITY;

--
-- Name: immunization_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.immunization_records ENABLE ROW LEVEL SECURITY;

--
-- Name: item_stocks; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.item_stocks ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- Name: job_openings; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_resources; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_requests; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: lecture_progress; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: lectures; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_advances; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.loan_advances ENABLE ROW LEVEL SECURITY;

--
-- Name: meal_attendance_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.meal_attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: medication_administrations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.medication_administrations ENABLE ROW LEVEL SECURITY;

--
-- Name: mentorship_matches; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.mentorship_matches ENABLE ROW LEVEL SECURITY;

--
-- Name: menu_items; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: parent_student_links; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_runs; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_settings; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: payslips; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_review_cycles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.performance_review_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_reviews; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: procurement_requests; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: route_assignments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: route_stops; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

--
-- Name: routes; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

--
-- Name: salary_structures; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;

--
-- Name: school_classes; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: screening_campaigns; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.screening_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: screening_results; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_attendance_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.staff_attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_certifications; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transactions; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: student_dietary_restrictions; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.student_dietary_restrictions ENABLE ROW LEVEL SECURITY;

--
-- Name: student_elective_selections; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.student_elective_selections ENABLE ROW LEVEL SECURITY;

--
-- Name: student_health_profiles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.student_health_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: student_transport_assignments; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: succession_plans; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.succession_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_subject_specializations; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.teacher_subject_specializations ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_feature_toggles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.tenant_feature_toggles ENABLE ROW LEVEL SECURITY;

--
-- Name: academic_years tenant_isolation_academic_years; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_academic_years ON public.academic_years USING (((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid) OR ((tenant_id IS NULL) AND (current_setting('app.current_tenant_id'::text, true) = ''::text))));


--
-- Name: activities tenant_isolation_activities; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_activities ON public.activities USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: activity_rosters tenant_isolation_activity_rosters; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_activity_rosters ON public.activity_rosters USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: admissions tenant_isolation_admissions; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_admissions ON public.admissions USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: alumni_event_registrations tenant_isolation_alumni_event_registrations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_alumni_event_registrations ON public.alumni_event_registrations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: alumni_events tenant_isolation_alumni_events; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_alumni_events ON public.alumni_events USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: alumni_profiles tenant_isolation_alumni_profiles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_alumni_profiles ON public.alumni_profiles USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: applicants tenant_isolation_applicants; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_applicants ON public.applicants USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: asset_tags tenant_isolation_asset_tags; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_asset_tags ON public.asset_tags USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: assignment_submissions tenant_isolation_assignment_submissions; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_assignment_submissions ON public.assignment_submissions USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: assignments tenant_isolation_assignments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_assignments ON public.assignments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: attendance_records tenant_isolation_attendance_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_attendance_records ON public.attendance_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: awards tenant_isolation_awards; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_awards ON public.awards USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: behavior_incidents tenant_isolation_behavior_incidents; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_behavior_incidents ON public.behavior_incidents USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: book_copies tenant_isolation_book_copies; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_book_copies ON public.book_copies USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: book_issues tenant_isolation_book_issues; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_book_issues ON public.book_issues USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: book_reservations tenant_isolation_book_reservations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_book_reservations ON public.book_reservations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: books tenant_isolation_books; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_books ON public.books USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: campuses tenant_isolation_campuses; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_campuses ON public.campuses USING (((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid) OR ((tenant_id IS NULL) AND (current_setting('app.current_tenant_id'::text, true) = ''::text))));


--
-- Name: certificates tenant_isolation_certificates; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_certificates ON public.certificates USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: circulars tenant_isolation_circulars; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_circulars ON public.circulars USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: class_elective_offerings tenant_isolation_class_elective_offerings; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_class_elective_offerings ON public.class_elective_offerings USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: clinic_visits tenant_isolation_clinic_visits; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_clinic_visits ON public.clinic_visits USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: corrective_actions tenant_isolation_corrective_actions; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_corrective_actions ON public.corrective_actions USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: counseling_referrals tenant_isolation_counseling_referrals; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_counseling_referrals ON public.counseling_referrals USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: daily_menu_items tenant_isolation_daily_menu_items; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_daily_menu_items ON public.daily_menu_items USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: daily_menus tenant_isolation_daily_menus; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_daily_menus ON public.daily_menus USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: diary_entries tenant_isolation_diary_entries; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_diary_entries ON public.diary_entries USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));


--
-- Name: diary_replies tenant_isolation_diary_replies; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_diary_replies ON public.diary_replies USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));


--
-- Name: discussion_posts tenant_isolation_discussion_posts; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_discussion_posts ON public.discussion_posts USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: discussion_threads tenant_isolation_discussion_threads; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_discussion_threads ON public.discussion_threads USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: document_acknowledgments tenant_isolation_document_acknowledgments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_document_acknowledgments ON public.document_acknowledgments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: documents tenant_isolation_documents; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_documents ON public.documents USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: donations tenant_isolation_donations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_donations ON public.donations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: drivers tenant_isolation_drivers; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_drivers ON public.drivers USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: employees tenant_isolation_employees; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_employees ON public.employees USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: event_registrations tenant_isolation_event_registrations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_event_registrations ON public.event_registrations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: events tenant_isolation_events; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_events ON public.events USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: exam_groups tenant_isolation_exam_groups; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_exam_groups ON public.exam_groups USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: exam_results tenant_isolation_exam_results; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_exam_results ON public.exam_results USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: exams tenant_isolation_exams; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_exams ON public.exams USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: fee_adjustments tenant_isolation_fee_adjustments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_fee_adjustments ON public.fee_adjustments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: fee_assignments tenant_isolation_fee_assignments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_fee_assignments ON public.fee_assignments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: fee_payments tenant_isolation_fee_payments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_fee_payments ON public.fee_payments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: fee_structures tenant_isolation_fee_structures; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_fee_structures ON public.fee_structures USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: full_final_settlements tenant_isolation_full_final_settlements; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_full_final_settlements ON public.full_final_settlements USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_attendance_records tenant_isolation_hostel_attendance_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_attendance_records ON public.hostel_attendance_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_maintenance_requests tenant_isolation_hostel_maintenance_requests; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_maintenance_requests ON public.hostel_maintenance_requests USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_room_allocations tenant_isolation_hostel_room_allocations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_room_allocations ON public.hostel_room_allocations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_room_preferences tenant_isolation_hostel_room_preferences; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_room_preferences ON public.hostel_room_preferences USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_rooms tenant_isolation_hostel_rooms; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_rooms ON public.hostel_rooms USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: hostel_visitors tenant_isolation_hostel_visitors; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_hostel_visitors ON public.hostel_visitors USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: immunization_records tenant_isolation_immunization_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_immunization_records ON public.immunization_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: item_stocks tenant_isolation_item_stocks; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_item_stocks ON public.item_stocks USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: items tenant_isolation_items; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_items ON public.items USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: job_openings tenant_isolation_job_openings; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_job_openings ON public.job_openings USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: learning_resources tenant_isolation_learning_resources; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_learning_resources ON public.learning_resources USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: leave_requests tenant_isolation_leave_requests; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_leave_requests ON public.leave_requests USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: lecture_progress tenant_isolation_lecture_progress; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_lecture_progress ON public.lecture_progress USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: lectures tenant_isolation_lectures; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_lectures ON public.lectures USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_advances tenant_isolation_loan_advances; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_loan_advances ON public.loan_advances USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: meal_attendance_records tenant_isolation_meal_attendance_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_meal_attendance_records ON public.meal_attendance_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: medication_administrations tenant_isolation_medication_administrations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_medication_administrations ON public.medication_administrations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: mentorship_matches tenant_isolation_mentorship_matches; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_mentorship_matches ON public.mentorship_matches USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: menu_items tenant_isolation_menu_items; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_menu_items ON public.menu_items USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: parent_student_links tenant_isolation_parent_student_links; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_parent_student_links ON public.parent_student_links USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: payroll_runs tenant_isolation_payroll_runs; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_payroll_runs ON public.payroll_runs USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: payroll_settings tenant_isolation_payroll_settings; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_payroll_settings ON public.payroll_settings USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: payslips tenant_isolation_payslips; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_payslips ON public.payslips USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: performance_review_cycles tenant_isolation_performance_review_cycles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_performance_review_cycles ON public.performance_review_cycles USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: performance_reviews tenant_isolation_performance_reviews; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_performance_reviews ON public.performance_reviews USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: procurement_requests tenant_isolation_procurement_requests; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_procurement_requests ON public.procurement_requests USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: roles tenant_isolation_roles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_roles ON public.roles USING (((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid) OR (tenant_id IS NULL)));


--
-- Name: route_assignments tenant_isolation_route_assignments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_route_assignments ON public.route_assignments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: route_stops tenant_isolation_route_stops; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_route_stops ON public.route_stops USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: routes tenant_isolation_routes; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_routes ON public.routes USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: salary_structures tenant_isolation_salary_structures; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_salary_structures ON public.salary_structures USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: school_classes tenant_isolation_school_classes; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_school_classes ON public.school_classes USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: screening_campaigns tenant_isolation_screening_campaigns; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_screening_campaigns ON public.screening_campaigns USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: screening_results tenant_isolation_screening_results; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_screening_results ON public.screening_results USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: staff_attendance_records tenant_isolation_staff_attendance_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_staff_attendance_records ON public.staff_attendance_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: staff_certifications tenant_isolation_staff_certifications; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_staff_certifications ON public.staff_certifications USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: stock_transactions tenant_isolation_stock_transactions; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_stock_transactions ON public.stock_transactions USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: student_dietary_restrictions tenant_isolation_student_dietary_restrictions; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_student_dietary_restrictions ON public.student_dietary_restrictions USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: student_elective_selections tenant_isolation_student_elective_selections; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_student_elective_selections ON public.student_elective_selections USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: student_health_profiles tenant_isolation_student_health_profiles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_student_health_profiles ON public.student_health_profiles USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: student_transport_assignments tenant_isolation_student_transport_assignments; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_student_transport_assignments ON public.student_transport_assignments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: students tenant_isolation_students; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_students ON public.students USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: subjects tenant_isolation_subjects; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_subjects ON public.subjects USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: succession_plans tenant_isolation_succession_plans; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_succession_plans ON public.succession_plans USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: teacher_subject_specializations tenant_isolation_teacher_subject_specializations; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_teacher_subject_specializations ON public.teacher_subject_specializations USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: tenant_feature_toggles tenant_isolation_tenant_feature_toggles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_tenant_feature_toggles ON public.tenant_feature_toggles USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: timetable_slots tenant_isolation_timetable_slots; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_timetable_slots ON public.timetable_slots USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: users tenant_isolation_users; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_users ON public.users USING (((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid) OR ((tenant_id IS NULL) AND (current_setting('app.current_tenant_id'::text, true) = ''::text))));


--
-- Name: vehicle_maintenance_records tenant_isolation_vehicle_maintenance_records; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_vehicle_maintenance_records ON public.vehicle_maintenance_records USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: vehicles tenant_isolation_vehicles; Type: POLICY; Schema: public; Owner: school_erp
--

CREATE POLICY tenant_isolation_vehicles ON public.vehicles USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: timetable_slots; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicle_maintenance_records; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.vehicle_maintenance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: school_erp
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO school_erp_app;


--
-- Name: TABLE academic_years; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_years TO school_erp_app;


--
-- Name: TABLE activities; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.activities TO school_erp_app;


--
-- Name: TABLE activity_rosters; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.activity_rosters TO school_erp_app;


--
-- Name: TABLE admissions; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.admissions TO school_erp_app;


--
-- Name: TABLE alumni_event_registrations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alumni_event_registrations TO school_erp_app;


--
-- Name: TABLE alumni_events; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alumni_events TO school_erp_app;


--
-- Name: TABLE alumni_profiles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alumni_profiles TO school_erp_app;


--
-- Name: TABLE applicants; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.applicants TO school_erp_app;


--
-- Name: TABLE asset_tags; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.asset_tags TO school_erp_app;


--
-- Name: TABLE assignment_submissions; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.assignment_submissions TO school_erp_app;


--
-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.assignments TO school_erp_app;


--
-- Name: TABLE attendance_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.attendance_records TO school_erp_app;


--
-- Name: TABLE awards; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.awards TO school_erp_app;


--
-- Name: TABLE behavior_incidents; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.behavior_incidents TO school_erp_app;


--
-- Name: TABLE book_copies; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.book_copies TO school_erp_app;


--
-- Name: TABLE book_issues; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.book_issues TO school_erp_app;


--
-- Name: TABLE book_reservations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.book_reservations TO school_erp_app;


--
-- Name: TABLE books; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.books TO school_erp_app;


--
-- Name: TABLE campuses; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.campuses TO school_erp_app;


--
-- Name: TABLE certificates; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.certificates TO school_erp_app;


--
-- Name: TABLE circular_read_receipts; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.circular_read_receipts TO school_erp_app;


--
-- Name: TABLE circulars; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.circulars TO school_erp_app;


--
-- Name: TABLE class_elective_offerings; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.class_elective_offerings TO school_erp_app;


--
-- Name: TABLE clinic_visits; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinic_visits TO school_erp_app;


--
-- Name: TABLE corrective_actions; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.corrective_actions TO school_erp_app;


--
-- Name: TABLE counseling_referrals; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.counseling_referrals TO school_erp_app;


--
-- Name: TABLE daily_menu_items; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.daily_menu_items TO school_erp_app;


--
-- Name: TABLE daily_menus; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.daily_menus TO school_erp_app;


--
-- Name: TABLE diary_entries; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.diary_entries TO school_erp_app;


--
-- Name: TABLE diary_replies; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.diary_replies TO school_erp_app;


--
-- Name: TABLE discussion_posts; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.discussion_posts TO school_erp_app;


--
-- Name: TABLE discussion_threads; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.discussion_threads TO school_erp_app;


--
-- Name: TABLE document_acknowledgments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.document_acknowledgments TO school_erp_app;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.documents TO school_erp_app;


--
-- Name: TABLE donations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.donations TO school_erp_app;


--
-- Name: TABLE drivers; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.drivers TO school_erp_app;


--
-- Name: TABLE employees; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.employees TO school_erp_app;


--
-- Name: TABLE event_registrations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_registrations TO school_erp_app;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO school_erp_app;


--
-- Name: TABLE exam_groups; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.exam_groups TO school_erp_app;


--
-- Name: TABLE exam_results; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.exam_results TO school_erp_app;


--
-- Name: TABLE exams; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.exams TO school_erp_app;


--
-- Name: TABLE fee_adjustments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_adjustments TO school_erp_app;


--
-- Name: TABLE fee_assignments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_assignments TO school_erp_app;


--
-- Name: TABLE fee_components; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_components TO school_erp_app;


--
-- Name: TABLE fee_installments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_installments TO school_erp_app;


--
-- Name: TABLE fee_payments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_payments TO school_erp_app;


--
-- Name: TABLE fee_structures; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_structures TO school_erp_app;


--
-- Name: TABLE full_final_settlements; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.full_final_settlements TO school_erp_app;


--
-- Name: TABLE hostel_attendance_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_attendance_records TO school_erp_app;


--
-- Name: TABLE hostel_maintenance_requests; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_maintenance_requests TO school_erp_app;


--
-- Name: TABLE hostel_room_allocations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_room_allocations TO school_erp_app;


--
-- Name: TABLE hostel_room_preferences; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_room_preferences TO school_erp_app;


--
-- Name: TABLE hostel_rooms; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_rooms TO school_erp_app;


--
-- Name: TABLE hostel_visitors; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hostel_visitors TO school_erp_app;


--
-- Name: TABLE immunization_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.immunization_records TO school_erp_app;


--
-- Name: TABLE item_stocks; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.item_stocks TO school_erp_app;


--
-- Name: TABLE items; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.items TO school_erp_app;


--
-- Name: TABLE job_openings; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.job_openings TO school_erp_app;


--
-- Name: TABLE learning_resources; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_resources TO school_erp_app;


--
-- Name: TABLE leave_requests; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.leave_requests TO school_erp_app;


--
-- Name: TABLE lecture_progress; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lecture_progress TO school_erp_app;


--
-- Name: TABLE lectures; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lectures TO school_erp_app;


--
-- Name: TABLE loan_advances; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.loan_advances TO school_erp_app;


--
-- Name: TABLE meal_attendance_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.meal_attendance_records TO school_erp_app;


--
-- Name: TABLE medication_administrations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.medication_administrations TO school_erp_app;


--
-- Name: TABLE mentorship_matches; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mentorship_matches TO school_erp_app;


--
-- Name: TABLE menu_items; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.menu_items TO school_erp_app;


--
-- Name: TABLE migrations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.migrations TO school_erp_app;


--
-- Name: TABLE parent_student_links; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.parent_student_links TO school_erp_app;


--
-- Name: TABLE payroll_runs; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payroll_runs TO school_erp_app;


--
-- Name: TABLE payroll_settings; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payroll_settings TO school_erp_app;


--
-- Name: TABLE payslips; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payslips TO school_erp_app;


--
-- Name: TABLE performance_review_cycles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.performance_review_cycles TO school_erp_app;


--
-- Name: TABLE performance_reviews; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.performance_reviews TO school_erp_app;


--
-- Name: TABLE procurement_requests; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.procurement_requests TO school_erp_app;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO school_erp_app;


--
-- Name: TABLE route_assignments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.route_assignments TO school_erp_app;


--
-- Name: TABLE route_stops; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.route_stops TO school_erp_app;


--
-- Name: TABLE routes; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.routes TO school_erp_app;


--
-- Name: TABLE salary_structures; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.salary_structures TO school_erp_app;


--
-- Name: TABLE school_classes; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.school_classes TO school_erp_app;


--
-- Name: TABLE screening_campaigns; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.screening_campaigns TO school_erp_app;


--
-- Name: TABLE screening_results; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.screening_results TO school_erp_app;


--
-- Name: TABLE staff_attendance_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.staff_attendance_records TO school_erp_app;


--
-- Name: TABLE staff_certifications; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.staff_certifications TO school_erp_app;


--
-- Name: TABLE stock_transactions; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.stock_transactions TO school_erp_app;


--
-- Name: TABLE student_dietary_restrictions; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_dietary_restrictions TO school_erp_app;


--
-- Name: TABLE student_elective_selections; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_elective_selections TO school_erp_app;


--
-- Name: TABLE student_health_profiles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_health_profiles TO school_erp_app;


--
-- Name: TABLE student_transport_assignments; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_transport_assignments TO school_erp_app;


--
-- Name: TABLE students; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.students TO school_erp_app;


--
-- Name: TABLE subjects; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subjects TO school_erp_app;


--
-- Name: TABLE succession_plans; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.succession_plans TO school_erp_app;


--
-- Name: TABLE teacher_subject_specializations; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.teacher_subject_specializations TO school_erp_app;


--
-- Name: TABLE tenant_feature_toggles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tenant_feature_toggles TO school_erp_app;


--
-- Name: TABLE tenants; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tenants TO school_erp_app;


--
-- Name: TABLE timetable_slots; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.timetable_slots TO school_erp_app;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO school_erp_app;


--
-- Name: TABLE vehicle_maintenance_records; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vehicle_maintenance_records TO school_erp_app;


--
-- Name: TABLE vehicles; Type: ACL; Schema: public; Owner: school_erp
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vehicles TO school_erp_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: school_erp
--

ALTER DEFAULT PRIVILEGES FOR ROLE school_erp IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO school_erp_app;


--
-- PostgreSQL database dump complete
--

\unrestrict E8gdBAURh3IWYESV2AJfCuxDlOR1ppFsbmN9eXK7oE1jBqUEOnvhW5zbMliNqCJ


#!/usr/bin/env bash
# ==============================================================================
# SchoolERP API test script
#
# Usage:
#   1. Fill in the CONFIG section below once (tenant id, campus id, academic
#      year id, a real student id — same values you've been pasting by hand).
#   2. Run the whole thing:      bash test-api.sh
#      Or run one module only:   bash test-api.sh transportation
#      Or run one module only:   bash test-api.sh library
#
# Each module lives in its own function (test_library, test_transportation,
# ...). To add a new module later, copy one of those functions, adjust the
# endpoints, and add its name to the dispatch at the bottom — nothing else
# needs to change.
#
# Requires: curl, jq
# ==============================================================================

set -uo pipefail

# ---------------------------------------------------------------------------
# CONFIG — fill these in once
# ---------------------------------------------------------------------------
API_BASE_URL="http://localhost:3000/api/v1"

TENANT_ID="fa0edb4d-37ca-4057-83b1-59bb6e8cb489"          # demo tenant
CAMPUS_ID="0fb92790-b84b-48df-8532-162edf540dbc"          # Main Campus
ACADEMIC_YEAR_ID=""                                        # fill in — current academic year id
STUDENT_ID="2bfb90c3-6115-481c-b0ed-f1f22a9bf726"          # any real seeded student

SCHOOL_ADMIN_EMAIL="school.admin1@demo.schoolerp.test"
TEACHER_EMAIL="teacher1@demo.schoolerp.test"
TEACHER3_EMAIL="teacher3@demo.schoolerp.test"
STUDENT1_EMAIL="student1@demo.schoolerp.test"
PASSWORD="Password123!"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

step() { echo -e "\n${YELLOW}>>> $1${NC}"; }
ok()   { echo -e "${GREEN}OK${NC} $1"; }
fail() { echo -e "${RED}FAIL${NC} $1"; }

# Logs in fresh each time it's called — tokens expire in 15 minutes, so call
# this again anytime a curl starts returning 401s instead of trying to reuse
# a stale $TOKEN across a long session.
login() {
  local email="$1"
  curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"tenant_id\":\"$TENANT_ID\",\"email\":\"$email\",\"password\":\"$PASSWORD\"}" \
    | jq -r '.access_token'
}

# Generic authenticated request. Usage: api METHOD path [json_body]
api() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -X "$method" "$API_BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -X "$method" "$API_BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN"
  fi
}

require_id() {
  local val="$1" label="$2"
  if [ "$val" == "null" ] || [ -z "$val" ]; then
    fail "Could not extract $label — response was:"
    echo "$3"
    exit 1
  fi
}

# Safe check for a 403 response. Using `.statusCode == 403` directly crashes
# jq with "Cannot index array with string" if the endpoint unexpectedly
# returns an array (e.g. a list response that ISN'T actually blocked) rather
# than an error object — which is exactly the shape of a real "Teacher
# wasn't blocked" bug, so the assertion needs to survive that case cleanly
# instead of crashing before it can report it.
expect_403() {
  echo "$1" | jq -e 'if type=="object" then .statusCode==403 else false end' > /dev/null
}

# Shared by several modules below — most non-Phase-0 tests need the current
# academic year and don't care which one, so fetch it once if CONFIG didn't
# set it.
ensure_academic_year() {
  if [ -z "$ACADEMIC_YEAR_ID" ]; then
    step "No ACADEMIC_YEAR_ID set in CONFIG — fetching current year automatically"
    RES=$(api GET "/academic-years?tenantId=$TENANT_ID")
    ACADEMIC_YEAR_ID=$(echo "$RES" | jq -r '.[] | select(.is_current==true) | .id')
    require_id "$ACADEMIC_YEAR_ID" "academic year id" "$RES"
    ok "using academic_year=$ACADEMIC_YEAR_ID"
  fi
}

# ---------------------------------------------------------------------------
# MODULE: Core Admin (Phase 0)
# ---------------------------------------------------------------------------
test_core_admin() {
  step "Core Admin — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create an academic year (NOT marked current — avoid disturbing the real current year used by every other test)"
  RES=$(api POST /academic-years "{\"tenant_id\":\"$TENANT_ID\",\"label\":\"Test-$(date +%s)\",\"start_date\":\"2030-06-01\",\"end_date\":\"2031-04-30\"}")
  NEW_YEAR_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_YEAR_ID" "academic year id" "$RES"
  ok "academic_year=$NEW_YEAR_ID"

  step "List academic years (should include the one just created)"
  RES=$(api GET "/academic-years?tenantId=$TENANT_ID")
  echo "$RES" | jq -e "any(.[]; .id == \"$NEW_YEAR_ID\")" > /dev/null \
    && ok "new year appears in list" || fail "new year missing from list: $RES"

  step "Create a campus"
  RES=$(api POST /campuses "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Campus $(date +%s)\",\"address\":\"123 Test St\"}")
  NEW_CAMPUS_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_CAMPUS_ID" "campus id" "$RES"
  ok "campus=$NEW_CAMPUS_ID"

  step "Create a custom role"
  RES=$(api POST /roles "{\"tenantId\":\"$TENANT_ID\",\"name\":\"Test Role $(date +%s)\"}")
  CUSTOM_ROLE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CUSTOM_ROLE_ID" "custom role id" "$RES"
  ok "custom_role=$CUSTOM_ROLE_ID"

  step "Update the custom role's permissions"
  RES=$(api PATCH "/roles/$CUSTOM_ROLE_ID/permissions" '{"permissions":[{"module":"library","action":"view"}]}')
  echo "$RES" | jq -e '.permissions | length == 1' > /dev/null \
    && ok "permissions updated" || fail "permission update failed: $RES"

  step "Create a user with the new custom role"
  RES=$(api POST /users "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$NEW_CAMPUS_ID\",\"role_id\":\"$CUSTOM_ROLE_ID\",\"name\":\"Test User\",\"email\":\"testuser$(date +%s)@demo.schoolerp.test\",\"password\":\"Password123!\"}")
  NEW_USER_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_USER_ID" "user id" "$RES"
  ok "user=$NEW_USER_ID"

  step "Confirm Teacher is blocked from a real gated Core Admin route (expect 403). NOTE: GET /academic-years deliberately has NO @Permissions() decorator — it's basic UI chrome every role needs (year selector, dashboards), not a Core Admin action — so it's NOT used for this check. GET /roles IS gated (module: core-admin, action: view) and is the correct route to test Teacher's actual Phase 0 permission set of []."
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/roles?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Student Lifecycle (Phase 1)
# ---------------------------------------------------------------------------
test_student_lifecycle() {
  step "Student Lifecycle — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Create a student"
  ADM_NUM="TEST-ADM-$(date +%s)"
  RES=$(api POST /students "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$CAMPUS_ID\",\"admission_number\":\"$ADM_NUM\",\"first_name\":\"Test\",\"last_name\":\"Student\",\"date_of_birth\":\"2015-01-01\",\"grade_level\":\"5\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"enrollment_date\":\"2026-06-01\",\"guardian_name\":\"Test Guardian\",\"guardian_phone\":\"9999911111\"}")
  NEW_STUDENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_STUDENT_ID" "student id" "$RES"
  ok "student=$NEW_STUDENT_ID"

  step "Fetch the student back by id"
  RES=$(api GET "/students/$NEW_STUDENT_ID")
  echo "$RES" | jq -e ".admission_number == \"$ADM_NUM\"" > /dev/null \
    && ok "fetched correctly" || fail "fetch mismatch: $RES"

  step "Update the student's admission number (typo-correction path, distinct from a status/class change)"
  RES=$(api PATCH "/students/$NEW_STUDENT_ID" "{\"admission_number\":\"${ADM_NUM}-FIXED\"}")
  echo "$RES" | jq -e ".admission_number == \"${ADM_NUM}-FIXED\"" > /dev/null \
    && ok "updated" || fail "update failed: $RES"

  step "Change status to withdrawn"
  RES=$(api PATCH "/students/$NEW_STUDENT_ID/status" '{"status":"withdrawn"}')
  echo "$RES" | jq -e '.status == "withdrawn"' > /dev/null \
    && ok "status changed" || fail "status change failed: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Admissions (Phase 1)
# ---------------------------------------------------------------------------
test_admissions() {
  step "Admissions — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Create an admission (starts at inquiry stage)"
  RES=$(api POST /admissions "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$CAMPUS_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"applicant_first_name\":\"Test\",\"applicant_last_name\":\"Applicant\",\"date_of_birth\":\"2016-01-01\",\"desired_grade_level\":\"4\",\"guardian_name\":\"Test Guardian\",\"guardian_phone\":\"9999922222\",\"source\":\"walk_in\"}")
  ADMISSION_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ADMISSION_ID" "admission id" "$RES"
  ok "admission=$ADMISSION_ID"

  # Real state machine (ALLOWED_TRANSITIONS in admissions.service.ts):
  #   inquiry -> application_submitted -> under_review -> approved
  # Each step is the only legal next move at that point — walk it exactly,
  # don't jump stages.
  step "Advance stage: inquiry -> application_submitted"
  RES=$(api PATCH "/admissions/$ADMISSION_ID/stage" '{"stage":"application_submitted"}')
  echo "$RES" | jq -e '.stage == "application_submitted"' > /dev/null \
    && ok "stage advanced to application_submitted" || fail "stage change failed: $RES"

  step "Advance stage: application_submitted -> under_review"
  RES=$(api PATCH "/admissions/$ADMISSION_ID/stage" '{"stage":"under_review"}')
  echo "$RES" | jq -e '.stage == "under_review"' > /dev/null \
    && ok "stage advanced to under_review" || fail "stage change failed: $RES"

  step "Advance stage: under_review -> approved"
  RES=$(api PATCH "/admissions/$ADMISSION_ID/stage" '{"stage":"approved"}')
  echo "$RES" | jq -e '.stage == "approved"' > /dev/null \
    && ok "stage advanced to approved" || fail "stage change failed: $RES"

  step "Enroll the admission (only legal from 'approved' — creates a linked student record via the dedicated endpoint, not a stage PATCH)"
  ADM_NUM="TEST-ENROLL-$(date +%s)"
  RES=$(api POST "/admissions/$ADMISSION_ID/enroll" "{\"admission_number\":\"$ADM_NUM\"}")
  # Real response shape is {admission: {...}, student: {...}} — no top-level
  # .id. Check the nested student id instead (confirms the actual enrollment
  # side-effect happened, not just that the request returned something).
  ENROLLED_STUDENT_ID=$(echo "$RES" | jq -r '.student.id')
  require_id "$ENROLLED_STUDENT_ID" "enrolled student id" "$RES"
  ok "enroll succeeded, student=$ENROLLED_STUDENT_ID"
}

# ---------------------------------------------------------------------------
# MODULE: Academic Management (Phase 1)
# ---------------------------------------------------------------------------
test_academic_management() {
  step "Academic Management — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Create a subject"
  RES=$(api POST /subjects "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Subject $(date +%s)\",\"code\":\"TS$(date +%s | tail -c 5)\"}")
  NEW_SUBJECT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_SUBJECT_ID" "subject id" "$RES"
  ok "subject=$NEW_SUBJECT_ID"

  step "Create a class (grade_level is timestamp-unique — a static value collided with itself on the second run, since (tenant, academic_year, grade_level, section) is a real unique constraint)"
  RES=$(api POST /classes "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$CAMPUS_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"grade_level\":\"Test9-$(date +%s)\",\"section\":\"Z\"}")
  NEW_CLASS_ID=$(echo "$RES" | jq -r '.id')
  require_id "$NEW_CLASS_ID" "class id" "$RES"
  ok "class=$NEW_CLASS_ID"

  step "Fetch a real teacher's user id (for the timetable slot)"
  TEACHER1_USER_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM users WHERE tenant_id='$TENANT_ID' AND email='$TEACHER_EMAIL';" 2>/dev/null | tr -d '[:space:]')
  require_id "$TEACHER1_USER_ID" "teacher1 user id" "$TEACHER1_USER_ID"

  step "Create a timetable slot — Saturday, period 12 (deliberately outside the normal Mon-Fri / lower-period window real seed data occupies, to avoid the 'teacher already scheduled' 409 that a weekday/period-1 slot hit on the first run)"
  RES=$(api POST /timetable "{\"tenant_id\":\"$TENANT_ID\",\"school_class_id\":\"$NEW_CLASS_ID\",\"subject_id\":\"$NEW_SUBJECT_ID\",\"teacher_id\":\"$TEACHER1_USER_ID\",\"day_of_week\":\"saturday\",\"period_number\":12}")
  SLOT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$SLOT_ID" "timetable slot id" "$RES"
  ok "slot=$SLOT_ID"

  step "Fetch timetable by class (should include the new slot)"
  RES=$(api GET "/timetable/by-class/$NEW_CLASS_ID")
  echo "$RES" | jq -e "any(.[]; .id == \"$SLOT_ID\")" > /dev/null \
    && ok "slot appears in by-class view" || fail "slot missing: $RES"

  step "Clean up: delete the timetable slot"
  api DELETE "/timetable/$SLOT_ID" > /dev/null
  ok "cleaned up slot"
}

# ---------------------------------------------------------------------------
# MODULE: Attendance (Phase 1)
# ---------------------------------------------------------------------------
test_attendance() {
  step "Attendance — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Fetch a real class via Aarav Sharma (Grade 6, section A) and two of its students — joining through a known student by name, rather than guessing grade_level's exact stored format (it's 'Grade 6', not '6')"
  CLASS6A_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT sc.id FROM students s JOIN school_classes sc ON sc.id = s.school_class_id WHERE s.tenant_id='$TENANT_ID' AND s.first_name='Aarav' AND s.last_name='Sharma';" 2>/dev/null | tr -d '[:space:]')
  require_id "$CLASS6A_ID" "Aarav's class id" "$CLASS6A_ID"

  STUDENT_IDS_JSON=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT json_agg(id) FROM (SELECT id FROM students WHERE tenant_id='$TENANT_ID' AND school_class_id='$CLASS6A_ID' LIMIT 2) s;" 2>/dev/null)
  require_id "$STUDENT_IDS_JSON" "Grade 6-A student ids" "$STUDENT_IDS_JSON"
  S1=$(echo "$STUDENT_IDS_JSON" | jq -r '.[0]')
  S2=$(echo "$STUDENT_IDS_JSON" | jq -r '.[1]')
  ok "using students S1=$S1 S2=$S2"

  step "Mark attendance for today"
  TODAY=$(date +%Y-%m-%d)
  RES=$(api POST /attendance "{\"tenant_id\":\"$TENANT_ID\",\"school_class_id\":\"$CLASS6A_ID\",\"date\":\"$TODAY\",\"entries\":[{\"student_id\":\"$S1\",\"status\":\"present\"},{\"student_id\":\"$S2\",\"status\":\"absent\",\"notes\":\"sick\"}]}")
  echo "$RES" | jq -e 'length >= 2' > /dev/null \
    && ok "attendance marked for 2 students" || fail "mark attendance failed: $RES"

  step "Re-mark (upsert) — change S2 from absent to present"
  RES=$(api POST /attendance "{\"tenant_id\":\"$TENANT_ID\",\"school_class_id\":\"$CLASS6A_ID\",\"date\":\"$TODAY\",\"entries\":[{\"student_id\":\"$S2\",\"status\":\"present\"}]}")
  echo "$RES" | jq -e ".[] | select(.student_id==\"$S2\") | .status == \"present\"" > /dev/null \
    && ok "upsert correctly updated S2 to present (no duplicate row)" || fail "upsert failed: $RES"

  step "Fetch attendance by student (should include today's record)"
  RES=$(api GET "/attendance/by-student/$S1")
  echo "$RES" | jq -e "any(.[]; .date == \"$TODAY\")" > /dev/null \
    && ok "today's record present in by-student view" || fail "record missing: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Fee Management (Phase 1)
# ---------------------------------------------------------------------------
test_fee_management() {
  step "Fee Management — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Fetch the seeded test student's grade level (fee structures are matched by grade_level)"
  STUDENT_GRADE=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT grade_level FROM students WHERE id='$STUDENT_ID';" 2>/dev/null | tr -d '[:space:]')
  require_id "$STUDENT_GRADE" "student's grade level" "$STUDENT_GRADE"

  step "Create a fee structure for that grade"
  RES=$(api POST /fee-structures "{\"tenant_id\":\"$TENANT_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"grade_level\":\"$STUDENT_GRADE\",\"name\":\"Test Fee Structure $(date +%s)\",\"components\":[{\"name\":\"Tuition\",\"amount\":\"1000.00\"}],\"installments\":[{\"label\":\"Term 1\",\"due_date\":\"2026-08-01\",\"amount\":\"1000.00\"}]}")
  FEE_STRUCTURE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$FEE_STRUCTURE_ID" "fee structure id" "$RES"
  ok "fee_structure=$FEE_STRUCTURE_ID"

  step "Assign the fee structure to the test student"
  RES=$(api POST /fee-assignments "{\"student_id\":\"$STUDENT_ID\",\"fee_structure_id\":\"$FEE_STRUCTURE_ID\"}")
  ASSIGNMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ASSIGNMENT_ID" "fee assignment id" "$RES"
  ok "fee_assignment=$ASSIGNMENT_ID"

  step "Check balance"
  RES=$(api GET "/fee-assignments/$ASSIGNMENT_ID/balance")
  echo "$RES" | jq -e '. != null' > /dev/null && ok "balance fetched" || fail "balance fetch failed: $RES"

  step "Add a discount adjustment"
  RES=$(api POST /fee-adjustments "{\"fee_assignment_id\":\"$ASSIGNMENT_ID\",\"type\":\"discount\",\"amount\":\"100.00\",\"reason\":\"Test sibling discount\"}")
  ADJ_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ADJ_ID" "adjustment id" "$RES"
  ok "adjustment=$ADJ_ID"

  step "Record a payment"
  RES=$(api POST /fee-payments "{\"fee_assignment_id\":\"$ASSIGNMENT_ID\",\"amount\":\"500.00\",\"payment_date\":\"$(date +%Y-%m-%d)\",\"method\":\"cash\"}")
  PAYMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$PAYMENT_ID" "payment id" "$RES"
  ok "payment=$PAYMENT_ID"

  step "Fetch receipt (a PDF stream — just confirm HTTP 200, not JSON shape)"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/fee-payments/$PAYMENT_ID/receipt" -H "Authorization: Bearer $TOKEN")
  [ "$HTTP_CODE" == "200" ] && ok "receipt downloaded (200)" || fail "expected 200, got $HTTP_CODE"

  step "Confirm Teacher is blocked (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/fee-structures?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Communication (Phase 1)
# ---------------------------------------------------------------------------
test_communication() {
  step "Communication — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create a whole-school circular"
  RES=$(api POST /circulars "{\"tenant_id\":\"$TENANT_ID\",\"title\":\"Test Circular $(date +%s)\",\"body\":\"This is a test circular body.\",\"audience_scope\":\"whole_school\"}")
  CIRCULAR_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CIRCULAR_ID" "circular id" "$RES"
  ok "circular=$CIRCULAR_ID"

  step "Fetch it back by id"
  RES=$(api GET "/circulars/$CIRCULAR_ID")
  echo "$RES" | jq -e ".id == \"$CIRCULAR_ID\"" > /dev/null \
    && ok "fetched" || fail "fetch failed: $RES"

  step "Mark as read (as School Admin themself) — checking HTTP status directly, not the body: markRead has no explicit body/HttpCode override, so it may return an empty 200/201 that isn't valid JSON to parse"
  READ_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/circulars/$CIRCULAR_ID/read" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
  [ "$READ_HTTP_CODE" -lt 400 ] 2>/dev/null && ok "marked read (HTTP $READ_HTTP_CODE)" || fail "mark-read failed with HTTP $READ_HTTP_CODE"

  step "Fetch read receipts"
  RES=$(api GET "/circulars/$CIRCULAR_ID/read-receipts")
  echo "$RES" | jq -e 'type == "array"' > /dev/null \
    && ok "read receipts fetched" || fail "receipts fetch failed: $RES"

  step "Clean up: delete the circular"
  api DELETE "/circulars/$CIRCULAR_ID" > /dev/null
  ok "cleaned up circular"
}

# ---------------------------------------------------------------------------
# MODULE: Examinations (Phase 2)
# ---------------------------------------------------------------------------
test_examinations() {
  step "Examinations — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Fetch a real class via Aarav Sharma (Grade 6, section A), 2 students in that class, and a subject with NO existing exam yet for this class+year (there's no DELETE /exams endpoint, so subjects get permanently consumed across repeated test runs — querying live for an unused one, rather than a fixed list position, buys more re-runs before all 5 real subjects are genuinely exhausted for this class+year, though exhaustion after a handful of runs is unavoidable without exam deletion support)"
  CLASS6A_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT sc.id FROM students s JOIN school_classes sc ON sc.id = s.school_class_id WHERE s.tenant_id='$TENANT_ID' AND s.first_name='Aarav' AND s.last_name='Sharma';" 2>/dev/null | tr -d '[:space:]')
  require_id "$CLASS6A_ID" "Aarav's class id" "$CLASS6A_ID"

  EXAM_SUBJECT_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT s.id FROM subjects s WHERE s.tenant_id='$TENANT_ID' AND NOT EXISTS (SELECT 1 FROM exams e WHERE e.subject_id = s.id AND e.school_class_id = '$CLASS6A_ID' AND e.academic_year_id = '$ACADEMIC_YEAR_ID') LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
  require_id "$EXAM_SUBJECT_ID" "a subject with no existing exam for this class+year (all real subjects may be exhausted from prior test runs — see step comment)" "$EXAM_SUBJECT_ID"

  STUDENT_IDS_JSON=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT json_agg(id) FROM (SELECT id FROM students WHERE tenant_id='$TENANT_ID' AND school_class_id='$CLASS6A_ID' LIMIT 2) s;" 2>/dev/null)
  require_id "$STUDENT_IDS_JSON" "Grade 6-A student ids" "$STUDENT_IDS_JSON"
  S1=$(echo "$STUDENT_IDS_JSON" | jq -r '.[0]')
  S2=$(echo "$STUDENT_IDS_JSON" | jq -r '.[1]')

  step "Create an exam"
  RES=$(api POST /exams "{\"tenant_id\":\"$TENANT_ID\",\"subject_id\":\"$EXAM_SUBJECT_ID\",\"school_class_id\":\"$CLASS6A_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"name\":\"Test Exam $(date +%s)\",\"exam_date\":\"2026-08-01\",\"max_marks\":\"100\"}")
  EXAM_ID=$(echo "$RES" | jq -r '.id')
  require_id "$EXAM_ID" "exam id" "$RES"
  ok "exam=$EXAM_ID"

  step "Enter marks for both students"
  RES=$(api POST /exams/marks "{\"exam_id\":\"$EXAM_ID\",\"entries\":[{\"student_id\":\"$S1\",\"marks_obtained\":\"85\"},{\"student_id\":\"$S2\",\"marks_obtained\":\"72\"}]}")
  echo "$RES" | jq -e 'if type=="object" then ((.statusCode // 200) < 400) else true end' > /dev/null \
    && ok "marks entered" || fail "marks entry failed: $RES"

  step "Fetch results for the exam"
  RES=$(api GET "/exams/$EXAM_ID/results")
  RESULT_COUNT=$(echo "$RES" | jq 'length')
  [ "$RESULT_COUNT" -ge 2 ] 2>/dev/null && ok "results fetched ($RESULT_COUNT entries)" || fail "results fetch failed: $RES"

  step "Fetch a SECOND subject with no existing exam for this class+year (excluding the one the standalone exam above just used) — same live-query approach as above, for the same reason"
  EXAM_GROUP_SUBJECT_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT s.id FROM subjects s WHERE s.tenant_id='$TENANT_ID' AND s.id != '$EXAM_SUBJECT_ID' AND NOT EXISTS (SELECT 1 FROM exams e WHERE e.subject_id = s.id AND e.school_class_id = '$CLASS6A_ID' AND e.academic_year_id = '$ACADEMIC_YEAR_ID') LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
  require_id "$EXAM_GROUP_SUBJECT_ID" "a second available subject (all real subjects may be exhausted from prior test runs — see step comment above)" "$EXAM_GROUP_SUBJECT_ID"

  step "Create an exam group covering this class + the second subject"
  RES=$(api POST /exam-groups "{\"tenant_id\":\"$TENANT_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"name\":\"Test Exam Group $(date +%s)\",\"subjects\":[{\"subject_id\":\"$EXAM_GROUP_SUBJECT_ID\",\"default_date\":\"2026-08-10\",\"default_max_marks\":100}],\"school_class_ids\":[\"$CLASS6A_ID\"]}")
  # Real response shape is {group: {...}, created: [...], skipped: [...]} —
  # no top-level .id, same pattern as Admissions' enroll() response.
  EXAM_GROUP_ID=$(echo "$RES" | jq -r '.group.id')
  require_id "$EXAM_GROUP_ID" "exam group id" "$RES"
  ok "exam_group=$EXAM_GROUP_ID"

  step "Fetch a report card for a student (should reflect the marks just entered)"
  RES=$(api GET "/report-cards/by-student/$S1")
  echo "$RES" | jq -e 'if type=="object" then ((.statusCode // 200) < 400) else true end' > /dev/null \
    && ok "report card fetched" || fail "report card fetch failed: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: LMS (Phase 2)
# ---------------------------------------------------------------------------
test_lms() {
  step "LMS — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  ensure_academic_year

  step "Fetch student1's own class (assignment must be scoped to student1's class for the submission ownership check to pass)"
  LMS_CLASS_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT s.school_class_id FROM users u JOIN students s ON s.id = u.student_id WHERE u.tenant_id='$TENANT_ID' AND u.email='$STUDENT1_EMAIL';" 2>/dev/null | tr -d '[:space:]')
  require_id "$LMS_CLASS_ID" "student1's class id" "$LMS_CLASS_ID"

  LMS_SUBJECT_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM subjects WHERE tenant_id='$TENANT_ID' LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
  require_id "$LMS_SUBJECT_ID" "a subject id" "$LMS_SUBJECT_ID"

  step "Create an assignment"
  RES=$(api POST /assignments "{\"tenant_id\":\"$TENANT_ID\",\"subject_id\":\"$LMS_SUBJECT_ID\",\"school_class_id\":\"$LMS_CLASS_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"title\":\"Test Assignment $(date +%s)\",\"due_date\":\"2026-08-15\",\"max_score\":100}")
  ASSIGNMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ASSIGNMENT_ID" "assignment id" "$RES"
  ok "assignment=$ASSIGNMENT_ID"

  step "Create a small test file to upload"
  echo "This is a test submission." > /tmp/schoolerp-test-upload.txt

  step "Log in as student1 and submit the assignment (multipart file upload)"
  TOKEN=$(login "$STUDENT1_EMAIL")
  RES=$(curl -s -X POST "$API_BASE_URL/assignment-submissions/$ASSIGNMENT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/schoolerp-test-upload.txt")
  SUBMISSION_ID=$(echo "$RES" | jq -r '.id')
  require_id "$SUBMISSION_ID" "submission id" "$RES"
  ok "submission=$SUBMISSION_ID"

  step "Grade the submission (as School Admin)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  RES=$(api PATCH "/assignment-submissions/$SUBMISSION_ID/grade" '{"score":88,"feedback":"Good work"}')
  # .score comes back as the STRING "88", not the number 88 — TypeORM
  # serializes numeric/decimal Postgres columns as strings by default to
  # avoid float precision loss. `(.score|tonumber)` normalizes before
  # comparing, rather than assuming a JS-number response shape.
  echo "$RES" | jq -e '(.score|tonumber) == 88' > /dev/null \
    && ok "graded" || fail "grading failed: $RES"

  step "Create a learning resource (multipart)"
  RES=$(curl -s -X POST "$API_BASE_URL/learning-resources" \
    -H "Authorization: Bearer $TOKEN" \
    -F "tenant_id=$TENANT_ID" -F "subject_id=$LMS_SUBJECT_ID" -F "school_class_id=$LMS_CLASS_ID" \
    -F "academic_year_id=$ACADEMIC_YEAR_ID" -F "title=Test Resource $(date +%s)" \
    -F "file=@/tmp/schoolerp-test-upload.txt")
  RESOURCE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$RESOURCE_ID" "learning resource id" "$RES"
  ok "resource=$RESOURCE_ID"

  step "Create a lecture (multipart) — needs BOTH a video extension AND an explicit Content-Type override. curl's automatic MIME-type inference from the .mp4 extension didn't work in this environment (it sent application/octet-stream, the generic fallback) — using the explicit ';type=video/mp4' multipart syntax instead of relying on inference. Content is fake/empty; only the declared type matters for this test."
  echo "fake video content for testing" > /tmp/schoolerp-test-lecture.mp4
  RES=$(curl -s -X POST "$API_BASE_URL/lectures" \
    -H "Authorization: Bearer $TOKEN" \
    -F "tenant_id=$TENANT_ID" -F "subject_id=$LMS_SUBJECT_ID" -F "school_class_id=$LMS_CLASS_ID" \
    -F "academic_year_id=$ACADEMIC_YEAR_ID" -F "title=Test Lecture $(date +%s)" \
    -F "file=@/tmp/schoolerp-test-lecture.mp4;type=video/mp4")
  LECTURE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$LECTURE_ID" "lecture id" "$RES"
  ok "lecture=$LECTURE_ID"

  step "Log in as student1 and mark the lecture watched"
  TOKEN=$(login "$STUDENT1_EMAIL")
  RES=$(api POST "/lectures/$LECTURE_ID/watched" '{}')
  echo "$RES" | jq -e 'if type=="object" then ((.statusCode // 200) < 400) else true end' > /dev/null \
    && ok "marked watched" || fail "mark-watched failed: $RES"

  step "Create a discussion thread (as School Admin)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  RES=$(api POST /discussion-threads "{\"tenant_id\":\"$TENANT_ID\",\"subject_id\":\"$LMS_SUBJECT_ID\",\"school_class_id\":\"$LMS_CLASS_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"title\":\"Test Discussion $(date +%s)\"}")
  THREAD_ID=$(echo "$RES" | jq -r '.id')
  require_id "$THREAD_ID" "discussion thread id" "$RES"
  ok "thread=$THREAD_ID"

  step "Post a reply to the thread"
  RES=$(api POST "/discussion-threads/$THREAD_ID/posts" '{"content":"Test reply content"}')
  POST_ID=$(echo "$RES" | jq -r '.id')
  require_id "$POST_ID" "discussion post id" "$RES"
  ok "post=$POST_ID"

  step "Fetch posts for the thread (should include the new post)"
  RES=$(api GET "/discussion-threads/$THREAD_ID/posts")
  echo "$RES" | jq -e "any(.[]; .id == \"$POST_ID\")" > /dev/null \
    && ok "post appears in thread" || fail "post missing: $RES"

  step "Clean up this run's test data"
  api DELETE "/assignments/$ASSIGNMENT_ID" > /dev/null
  api DELETE "/discussion-threads/$THREAD_ID" > /dev/null
  api DELETE "/lectures/$LECTURE_ID" > /dev/null
  api DELETE "/learning-resources/$RESOURCE_ID" > /dev/null
  ok "cleaned up this run's test data"
}

# ---------------------------------------------------------------------------
# MODULE: Library
# ---------------------------------------------------------------------------
test_library() {
  step "Library — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create a book"
  RES=$(api POST /library/books "{\"tenant_id\":\"$TENANT_ID\",\"title\":\"Test Book $(date +%s)\",\"author\":\"Test Author\",\"category\":\"Fiction\"}")
  BOOK_ID=$(echo "$RES" | jq -r '.id')
  require_id "$BOOK_ID" "book id" "$RES"
  ok "book=$BOOK_ID"

  step "Add a copy"
  BARCODE="LIB-TEST-$(date +%s)"
  RES=$(api POST "/library/books/$BOOK_ID/copies" "{\"tenant_id\":\"$TENANT_ID\",\"book_id\":\"$BOOK_ID\",\"campus_id\":\"$CAMPUS_ID\",\"barcode\":\"$BARCODE\"}")
  COPY_ID=$(echo "$RES" | jq -r '.id')
  require_id "$COPY_ID" "copy id" "$RES"
  ok "copy=$COPY_ID barcode=$BARCODE"

  step "Issue by barcode"
  RES=$(api POST /library/issues "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT_ID\",\"due_date\":\"2026-08-01\",\"barcode\":\"$BARCODE\"}")
  ISSUE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ISSUE_ID" "issue id" "$RES"
  ok "issue=$ISSUE_ID"

  step "Return it"
  RES=$(api POST /library/issues/return "{\"barcode\":\"$BARCODE\"}")
  FINE=$(echo "$RES" | jq -r '.fine_amount')
  ok "returned, fine_amount=$FINE (expect null — same-day return)"

  step "Confirm Teacher is blocked (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/library/books?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Transportation
# ---------------------------------------------------------------------------
test_transportation() {
  step "Transportation — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create a vehicle"
  REG="TR-TEST-$(date +%s)"
  RES=$(api POST /transportation/vehicles "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$CAMPUS_ID\",\"registration_number\":\"$REG\",\"model\":\"Tata Starbus\",\"capacity\":40}")
  VEHICLE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$VEHICLE_ID" "vehicle id" "$RES"
  ok "vehicle=$VEHICLE_ID"

  step "Create a maintenance record with a past scheduled_date (expect stored status=scheduled)"
  RES=$(api POST /transportation/maintenance-records "{\"tenant_id\":\"$TENANT_ID\",\"vehicle_id\":\"$VEHICLE_ID\",\"maintenance_type\":\"routine\",\"description\":\"Oil change\",\"scheduled_date\":\"2026-01-01\"}")
  MAINTENANCE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$MAINTENANCE_ID" "maintenance record id" "$RES"
  echo "$RES" | jq -e '.status == "scheduled"' > /dev/null && ok "stored as scheduled" || fail "unexpected: $RES"

  step "Fetch the list — confirm the same record now shows status=overdue (computed on read, not stored)"
  RES=$(api GET "/transportation/maintenance-records?tenantId=$TENANT_ID&vehicleId=$VEHICLE_ID")
  echo "$RES" | jq -e --arg id "$MAINTENANCE_ID" '.[] | select(.id == $id) | .status == "overdue"' > /dev/null \
    && ok "correctly shown as overdue on read" || fail "expected overdue on read: $RES"

  step "Mark it completed"
  RES=$(api PATCH "/transportation/maintenance-records/$MAINTENANCE_ID/complete" "{\"completed_date\":\"$(date +%Y-%m-%d)\",\"cost\":\"85.50\"}")
  echo "$RES" | jq -e '.status == "completed" and .cost == "85.50"' > /dev/null && ok "marked completed with cost recorded" || fail "unexpected: $RES"

  step "Try completing it again (expect 400 — already completed)"
  RES=$(api PATCH "/transportation/maintenance-records/$MAINTENANCE_ID/complete" "{\"completed_date\":\"$(date +%Y-%m-%d)\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected duplicate completion" || fail "expected 400, got: $RES"

  step "Create a driver"
  RES=$(api POST /transportation/drivers "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Driver\",\"license_number\":\"DL-$(date +%s)\",\"phone\":\"9999900000\"}")
  DRIVER_ID=$(echo "$RES" | jq -r '.id')
  require_id "$DRIVER_ID" "driver id" "$RES"
  ok "driver=$DRIVER_ID"

  step "Create a route"
  RES=$(api POST /transportation/routes "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Route $(date +%s)\",\"description\":\"North loop\"}")
  ROUTE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ROUTE_ID" "route id" "$RES"
  ok "route=$ROUTE_ID"

  step "Add stop 1"
  RES=$(api POST "/transportation/routes/$ROUTE_ID/stops" "{\"tenant_id\":\"$TENANT_ID\",\"route_id\":\"$ROUTE_ID\",\"name\":\"Stop A\",\"sequence_order\":1}")
  STOP1_ID=$(echo "$RES" | jq -r '.id')
  require_id "$STOP1_ID" "stop 1 id" "$RES"
  ok "stop1=$STOP1_ID"

  step "Add stop 2"
  RES=$(api POST "/transportation/routes/$ROUTE_ID/stops" "{\"tenant_id\":\"$TENANT_ID\",\"route_id\":\"$ROUTE_ID\",\"name\":\"Stop B\",\"sequence_order\":2}")
  STOP2_ID=$(echo "$RES" | jq -r '.id')
  require_id "$STOP2_ID" "stop 2 id" "$RES"
  ok "stop2=$STOP2_ID"

  step "List route (should show both stops)"
  RES=$(api GET "/transportation/routes/$ROUTE_ID")
  COUNT=$(echo "$RES" | jq '.stops | length')
  [ "$COUNT" == "2" ] && ok "2 stops returned" || fail "expected 2 stops, got $COUNT: $RES"

  ensure_academic_year

  step "Create route assignment (vehicle + driver -> route)"
  RES=$(api POST /transportation/route-assignments "{\"tenant_id\":\"$TENANT_ID\",\"route_id\":\"$ROUTE_ID\",\"vehicle_id\":\"$VEHICLE_ID\",\"driver_id\":\"$DRIVER_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\"}")
  ASSIGNMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ASSIGNMENT_ID" "route assignment id" "$RES"
  ok "route_assignment=$ASSIGNMENT_ID"

  step "Try a SECOND assignment for the same route+year (expect 409 conflict)"
  RES=$(api POST /transportation/route-assignments "{\"tenant_id\":\"$TENANT_ID\",\"route_id\":\"$ROUTE_ID\",\"vehicle_id\":\"$VEHICLE_ID\",\"driver_id\":\"$DRIVER_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\"}")
  echo "$RES" | jq -e '.statusCode == 409' > /dev/null && ok "correctly rejected with 409" || fail "expected 409, got: $RES"

  step "Fetch a second student (Diya Patel) for the stop-mismatch test below — using a distinct student avoids colliding with the primary assignment's 'one per student per year' rule"
  STUDENT2_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM students WHERE tenant_id='$TENANT_ID' AND first_name='Diya' AND last_name='Patel';" 2>/dev/null | tr -d '[:space:]')
  require_id "$STUDENT2_ID" "second student id" "$STUDENT2_ID"

  step "Clean up any pre-existing transport assignments for both test students (makes this script re-runnable — otherwise a second run always 400s on 'already assigned')"
  for SID in "$STUDENT_ID" "$STUDENT2_ID"; do
    EXISTING=$(api GET "/transportation/student-assignments?tenantId=$TENANT_ID&academicYearId=$ACADEMIC_YEAR_ID" | jq -r ".[] | select(.student_id==\"$SID\") | .id")
    if [ -n "$EXISTING" ] && [ "$EXISTING" != "null" ]; then
      api DELETE "/transportation/student-assignments/$EXISTING" > /dev/null
    fi
  done
  ok "cleaned up any prior test assignments"

  step "Assign student to route + stop1 (valid pair)"
  RES=$(api POST /transportation/student-assignments "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT_ID\",\"route_id\":\"$ROUTE_ID\",\"stop_id\":\"$STOP1_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\"}")
  STUDENT_ASSIGNMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$STUDENT_ASSIGNMENT_ID" "student assignment id" "$RES"
  ok "student_assignment=$STUDENT_ASSIGNMENT_ID"

  step "Create a SECOND route, try assigning a DIFFERENT student (Diya) to route1's stop against route2 (expect 400 — stop doesn't belong to route, not 'already assigned')"
  RES=$(api POST /transportation/routes "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Route 2 $(date +%s)\"}")
  ROUTE2_ID=$(echo "$RES" | jq -r '.id')
  RES=$(api POST /transportation/student-assignments "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT2_ID\",\"route_id\":\"$ROUTE2_ID\",\"stop_id\":\"$STOP1_ID\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\"}")
  echo "$RES" | jq -e '.statusCode == 400 and (.message.message | test("does not belong"))' > /dev/null \
    && ok "correctly rejected — stop doesn't belong to route (verified the actual message, not just the status code)" \
    || fail "expected a stop-mismatch 400 specifically, got: $RES"

  step "Confirm Teacher is blocked (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/transportation/vehicles?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"

  step "Confirm Teacher is also blocked from maintenance-records specifically (expect 403)"
  RES=$(api GET "/transportation/maintenance-records?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd on maintenance-records" || fail "Teacher was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Cafeteria
# ---------------------------------------------------------------------------
test_cafeteria() {
  step "Cafeteria — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create menu item 1 (Rice & Dal)"
  RES=$(api POST /cafeteria/menu-items "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Rice & Dal $(date +%s)\",\"description\":\"Steamed rice with lentil curry\",\"dietary_tags\":\"vegetarian\"}")
  ITEM1_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ITEM1_ID" "menu item 1 id" "$RES"
  ok "item1=$ITEM1_ID"

  step "Create menu item 2 (Garden Salad)"
  RES=$(api POST /cafeteria/menu-items "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Garden Salad $(date +%s)\",\"dietary_tags\":\"vegan, gluten_free\"}")
  ITEM2_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ITEM2_ID" "menu item 2 id" "$RES"
  ok "item2=$ITEM2_ID"

  MENU_DATE=$(date +%Y-%m-%d)
  step "Clean up any pre-existing daily menu for today+lunch (makes this re-runnable — otherwise a same-day second run hits the unique constraint)"
  EXISTING_MENU=$(api GET "/cafeteria/daily-menus?tenantId=$TENANT_ID&dateFrom=$MENU_DATE&dateTo=$MENU_DATE" | jq -r '.[] | select(.meal_type=="lunch") | .id')
  if [ -n "$EXISTING_MENU" ] && [ "$EXISTING_MENU" != "null" ]; then
    api DELETE "/cafeteria/daily-menus/$EXISTING_MENU" > /dev/null
    ok "removed pre-existing daily menu from a previous run"
  fi

  step "Create a daily menu (today, lunch)"
  RES=$(api POST /cafeteria/daily-menus "{\"tenant_id\":\"$TENANT_ID\",\"menu_date\":\"$MENU_DATE\",\"meal_type\":\"lunch\"}")
  MENU_ID=$(echo "$RES" | jq -r '.id')
  require_id "$MENU_ID" "daily menu id" "$RES"
  ok "daily_menu=$MENU_ID"

  step "Add both items to the daily menu"
  RES=$(api POST "/cafeteria/daily-menus/$MENU_ID/items" "{\"tenant_id\":\"$TENANT_ID\",\"menu_item_id\":\"$ITEM1_ID\"}")
  JOIN1_ID=$(echo "$RES" | jq -r '.id')
  require_id "$JOIN1_ID" "join 1 id" "$RES"
  RES=$(api POST "/cafeteria/daily-menus/$MENU_ID/items" "{\"tenant_id\":\"$TENANT_ID\",\"menu_item_id\":\"$ITEM2_ID\"}")
  JOIN2_ID=$(echo "$RES" | jq -r '.id')
  require_id "$JOIN2_ID" "join 2 id" "$RES"
  ok "both items added"

  step "Try adding item1 again (expect 400 — already on this menu)"
  RES=$(api POST "/cafeteria/daily-menus/$MENU_ID/items" "{\"tenant_id\":\"$TENANT_ID\",\"menu_item_id\":\"$ITEM1_ID\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected duplicate" || fail "expected 400, got: $RES"

  step "Fetch the daily menu by ID (should show 2 items)"
  RES=$(api GET "/cafeteria/daily-menus/$MENU_ID")
  COUNT=$(echo "$RES" | jq '.items | length')
  [ "$COUNT" == "2" ] && ok "2 items returned" || fail "expected 2 items, got $COUNT: $RES"

  step "Fetch 3 real student ids from the seed data"
  STUDENT_IDS_JSON=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT json_agg(id) FROM (SELECT id FROM students WHERE tenant_id = '$TENANT_ID' LIMIT 3) s;" 2>/dev/null)
  if [ -z "$STUDENT_IDS_JSON" ] || [ "$STUDENT_IDS_JSON" == "null" ]; then
    fail "Could not fetch student ids from DB — is the postgres container named school-erp-postgres? Falling back to STUDENT_ID only."
    STUDENT_IDS_JSON="[\"$STUDENT_ID\"]"
  fi
  ok "using students=$STUDENT_IDS_JSON"

  step "Record bulk meal attendance for those students"
  RES=$(api POST /cafeteria/meal-attendance "{\"tenant_id\":\"$TENANT_ID\",\"attendance_date\":\"$MENU_DATE\",\"meal_type\":\"lunch\",\"student_ids\":$STUDENT_IDS_JSON}")
  RECORDED_COUNT=$(echo "$RES" | jq 'length')
  ok "recorded $RECORDED_COUNT attendance row(s)"

  step "Re-submit the SAME students (expect same count back, no error, no duplicates)"
  RES=$(api POST /cafeteria/meal-attendance "{\"tenant_id\":\"$TENANT_ID\",\"attendance_date\":\"$MENU_DATE\",\"meal_type\":\"lunch\",\"student_ids\":$STUDENT_IDS_JSON}")
  REPEAT_COUNT=$(echo "$RES" | jq 'length')
  [ "$REPEAT_COUNT" == "$RECORDED_COUNT" ] && ok "idempotent re-submit ($REPEAT_COUNT unchanged)" || fail "expected $RECORDED_COUNT, got $REPEAT_COUNT"

  step "Check headcounts for a date range covering today"
  RES=$(api GET "/cafeteria/meal-attendance/headcounts?tenantId=$TENANT_ID&dateFrom=$MENU_DATE&dateTo=$MENU_DATE")
  echo "$RES" | jq -e "any(.[]; .meal_type == \"lunch\" and .attendance_date == \"$MENU_DATE\")" > /dev/null \
    && ok "headcount row present for today's lunch" || fail "no matching headcount row: $RES"

  step "Create a dietary restriction (vegetarian) for the first student"
  FIRST_STUDENT=$(echo "$STUDENT_IDS_JSON" | jq -r '.[0]')
  RES=$(api POST /cafeteria/dietary-restrictions "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$FIRST_STUDENT\",\"restriction_type\":\"vegetarian\",\"details\":\"No meat or fish\"}")
  RESTRICTION_ID=$(echo "$RES" | jq -r '.id')
  require_id "$RESTRICTION_ID" "dietary restriction id" "$RES"
  ok "restriction=$RESTRICTION_ID"

  step "Try deleting item1 while it's still on the daily menu (expect 400)"
  RES=$(api DELETE "/cafeteria/menu-items/$ITEM1_ID")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — item still on a menu" || fail "expected 400, got: $RES"

  step "Confirm Teacher is blocked (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/cafeteria/menu-items?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"

  step "Cleanup — remove the daily menu first (cascades its item-links), then both test dishes, so repeated runs don't pile up timestamped dishes in the real catalog"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  api DELETE "/cafeteria/daily-menus/$MENU_ID" > /dev/null
  api DELETE "/cafeteria/menu-items/$ITEM1_ID" > /dev/null
  api DELETE "/cafeteria/menu-items/$ITEM2_ID" > /dev/null
  ok "cleaned up this run's test data"
}

# ---------------------------------------------------------------------------
# MODULE: Health & Wellness
# ---------------------------------------------------------------------------
test_health_wellness() {
  step "Health & Wellness — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Fetch Aarav Sharma's id (Grade 6-A, teacher1's scope)"
  AARAV_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM students WHERE tenant_id='$TENANT_ID' AND first_name='Aarav' AND last_name='Sharma';" 2>/dev/null | tr -d '[:space:]')
  require_id "$AARAV_ID" "Aarav's student id" "$AARAV_ID"

  step "Fetch Sara Khan's id (Grade 7-A, teacher3's scope — teacher1 should NOT see her)"
  SARA_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM students WHERE tenant_id='$TENANT_ID' AND first_name='Sara' AND last_name='Khan';" 2>/dev/null | tr -d '[:space:]')
  require_id "$SARA_ID" "Sara's student id" "$SARA_ID"

  step "Upsert a health profile for Aarav"
  RES=$(api POST /health-wellness/profiles "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$AARAV_ID\",\"blood_group\":\"O+\",\"allergies\":\"Test allergy $(date +%s)\"}")
  PROFILE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$PROFILE_ID" "profile id" "$RES"
  ok "profile=$PROFILE_ID"

  step "Add an immunization record for Aarav"
  RES=$(api POST /health-wellness/immunizations "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$AARAV_ID\",\"vaccine_name\":\"Test Vaccine\",\"date_administered\":\"2026-01-01\"}")
  IMM_ID=$(echo "$RES" | jq -r '.id')
  require_id "$IMM_ID" "immunization id" "$RES"
  ok "immunization=$IMM_ID"

  step "Log a clinic visit for Aarav"
  RES=$(api POST /health-wellness/clinic-visits "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$AARAV_ID\",\"visit_date\":\"2026-07-01T10:00:00Z\",\"reason\":\"Headache\"}")
  VISIT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$VISIT_ID" "clinic visit id" "$RES"
  ok "visit=$VISIT_ID"

  step "Update the visit — add treatment, flag follow-up"
  RES=$(api PATCH "/health-wellness/clinic-visits/$VISIT_ID" "{\"treatment_given\":\"Rested in nurse's office\",\"follow_up_required\":true}")
  echo "$RES" | jq -e '.follow_up_required == true' > /dev/null && ok "visit updated" || fail "update failed: $RES"

  step "Create a screening campaign + a result for Aarav"
  RES=$(api POST /health-wellness/screening-campaigns "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Screening $(date +%s)\",\"screening_type\":\"vision\",\"campaign_date\":\"2026-07-01\"}")
  CAMPAIGN_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CAMPAIGN_ID" "campaign id" "$RES"
  RES=$(api POST /health-wellness/screening-results "{\"tenant_id\":\"$TENANT_ID\",\"campaign_id\":\"$CAMPAIGN_ID\",\"student_id\":\"$AARAV_ID\",\"result_summary\":\"20/20\"}")
  RESULT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$RESULT_ID" "result id" "$RES"
  ok "campaign=$CAMPAIGN_ID result=$RESULT_ID"

  step "As School Admin, confirm unscoped view sees both Aarav and Sara"
  RES=$(api GET "/health-wellness/profiles?tenantId=$TENANT_ID")
  HAS_AARAV_ADMIN=$(echo "$RES" | jq "any(.[]; .student_id == \"$AARAV_ID\")")
  [ "$HAS_AARAV_ADMIN" == "true" ] && ok "Admin sees Aarav" || fail "Admin should see Aarav: $RES"

  step "Login as teacher1 (scoped to Grade 6-A) — should see Aarav, NOT Sara"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/health-wellness/profiles?tenantId=$TENANT_ID")
  HAS_AARAV=$(echo "$RES" | jq "any(.[]; .student_id == \"$AARAV_ID\")")
  HAS_SARA=$(echo "$RES" | jq "any(.[]; .student_id == \"$SARA_ID\")")
  [ "$HAS_AARAV" == "true" ] && ok "teacher1 correctly sees Aarav Sharma (Grade 6-A)" || fail "teacher1 did NOT see Aarav: $RES"
  [ "$HAS_SARA" == "false" ] && ok "teacher1 correctly does NOT see Sara Khan (Grade 7-A)" || fail "teacher1 incorrectly saw Sara Khan: $RES"

  step "Login as teacher3 (scoped to Grade 7-A) — should see Sara, NOT Aarav"
  TOKEN=$(login "$TEACHER3_EMAIL")
  RES=$(api GET "/health-wellness/profiles?tenantId=$TENANT_ID")
  HAS_AARAV3=$(echo "$RES" | jq "any(.[]; .student_id == \"$AARAV_ID\")")
  HAS_SARA3=$(echo "$RES" | jq "any(.[]; .student_id == \"$SARA_ID\")")
  [ "$HAS_SARA3" == "true" ] && ok "teacher3 correctly sees Sara Khan (Grade 7-A)" || fail "teacher3 did NOT see Sara: $RES"
  [ "$HAS_AARAV3" == "false" ] && ok "teacher3 correctly does NOT see Aarav Sharma (Grade 6-A)" || fail "teacher3 incorrectly saw Aarav: $RES"

  step "Confirm teacher1 is blocked from CREATE (expect 403 — view only, not full access)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api POST /health-wellness/profiles "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$AARAV_ID\",\"blood_group\":\"A+\"}")
  expect_403 "$RES" && ok "Teacher correctly 403'd on create" || fail "Teacher was NOT blocked from create: $RES"
}

# ---------------------------------------------------------------------------
# MODULE: Inventory & Assets
# ---------------------------------------------------------------------------
test_inventory_assets() {
  step "Inventory & Assets — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create a bulk item"
  RES=$(api POST /inventory-assets/items "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Bulk Item $(date +%s)\",\"category\":\"stationery\",\"unit\":\"box\",\"is_trackable_asset\":false,\"reorder_point\":5}")
  BULK_ITEM_ID=$(echo "$RES" | jq -r '.id')
  require_id "$BULK_ITEM_ID" "bulk item id" "$RES"
  ok "bulk_item=$BULK_ITEM_ID"

  step "Create a trackable item"
  RES=$(api POST /inventory-assets/items "{\"tenant_id\":\"$TENANT_ID\",\"name\":\"Test Asset $(date +%s)\",\"category\":\"lab_equipment\",\"unit\":\"pcs\",\"is_trackable_asset\":true}")
  ASSET_ITEM_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ASSET_ITEM_ID" "trackable item id" "$RES"
  ok "asset_item=$ASSET_ITEM_ID"

  step "Record a RECEIVED transaction for the bulk item (qty 20)"
  RES=$(api POST /inventory-assets/stock/transactions "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$BULK_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"transaction_type\":\"received\",\"quantity\":20,\"transaction_date\":\"2026-07-01\"}")
  echo "$RES" | jq -e '.id' > /dev/null && ok "transaction recorded" || fail "transaction failed: $RES"

  step "Check stock shows 20 on hand"
  RES=$(api GET "/inventory-assets/stock?tenantId=$TENANT_ID&campusId=$CAMPUS_ID")
  QTY=$(echo "$RES" | jq -r ".[] | select(.item_id==\"$BULK_ITEM_ID\") | .quantity_on_hand")
  [ "$QTY" == "20" ] && ok "stock shows 20 on hand" || fail "expected 20, got $QTY: $RES"

  step "Try issuing 25 (more than on hand) — expect 400"
  RES=$(api POST /inventory-assets/stock/transactions "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$BULK_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"transaction_type\":\"issued\",\"quantity\":25,\"transaction_date\":\"2026-07-02\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected over-issue" || fail "expected 400, got: $RES"

  step "Try a stock transaction against the TRACKABLE item — expect 400 (wrong tracking mode)"
  RES=$(api POST /inventory-assets/stock/transactions "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$ASSET_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"transaction_type\":\"received\",\"quantity\":1,\"transaction_date\":\"2026-07-01\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — wrong tracking mode" || fail "expected 400, got: $RES"

  step "Create an asset tag for the trackable item"
  RES=$(api POST /inventory-assets/asset-tags "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$ASSET_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"asset_tag_number\":\"TEST-TAG-$(date +%s)\"}")
  TAG_ID=$(echo "$RES" | jq -r '.id')
  require_id "$TAG_ID" "asset tag id" "$RES"
  ok "tag=$TAG_ID"

  step "Try creating an asset tag for the BULK item — expect 400 (wrong tracking mode)"
  RES=$(api POST /inventory-assets/asset-tags "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$BULK_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"asset_tag_number\":\"BAD-TAG-$(date +%s)\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — wrong tracking mode" || fail "expected 400, got: $RES"

  step "Update the asset tag status to under_repair"
  RES=$(api PATCH "/inventory-assets/asset-tags/$TAG_ID" "{\"status\":\"under_repair\"}")
  echo "$RES" | jq -e '.status == "under_repair"' > /dev/null && ok "tag status updated" || fail "update failed: $RES"

  step "Create a procurement request"
  RES=$(api POST /inventory-assets/procurement-requests "{\"tenant_id\":\"$TENANT_ID\",\"item_id\":\"$BULK_ITEM_ID\",\"campus_id\":\"$CAMPUS_ID\",\"quantity_requested\":10,\"requested_date\":\"2026-07-05\"}")
  REQUEST_ID=$(echo "$RES" | jq -r '.id')
  require_id "$REQUEST_ID" "procurement request id" "$RES"
  ok "request=$REQUEST_ID"

  step "Try jumping straight to fulfilled (expect 400 — invalid transition from pending)"
  RES=$(api PATCH "/inventory-assets/procurement-requests/$REQUEST_ID/status" "{\"status\":\"fulfilled\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected invalid transition" || fail "expected 400, got: $RES"

  step "Approve, then fulfill (valid transitions)"
  RES=$(api PATCH "/inventory-assets/procurement-requests/$REQUEST_ID/status" "{\"status\":\"approved\"}")
  echo "$RES" | jq -e '.status == "approved"' > /dev/null && ok "approved" || fail "approve failed: $RES"
  RES=$(api PATCH "/inventory-assets/procurement-requests/$REQUEST_ID/status" "{\"status\":\"fulfilled\"}")
  echo "$RES" | jq -e '.status == "fulfilled"' > /dev/null && ok "fulfilled" || fail "fulfill failed: $RES"

  step "Try deleting the bulk item while it has stock/procurement history — expect 400"
  RES=$(api DELETE "/inventory-assets/items/$BULK_ITEM_ID")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — item has history" || fail "expected 400, got: $RES"

  step "Confirm Teacher is blocked (expect 403 — Admin-only module, no view exception here)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/inventory-assets/items?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"
}
# ---------------------------------------------------------------------------
# MODULE: Feature Toggle
# ---------------------------------------------------------------------------
test_feature_toggles() {
  step "Feature Toggles — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "List feature toggles (expect the two Cafeteria rows, both disabled)"
  RES=$(api GET "/feature-toggles")
  MEAL_ROW=$(echo "$RES" | jq -e '.[] | select(.feature_key == "cafeteria.meal_attendance")')
  [ -n "$MEAL_ROW" ] && ok "cafeteria.meal_attendance row present" || fail "row missing: $RES"
  echo "$MEAL_ROW" | jq -e '.enabled == false' > /dev/null && ok "correctly disabled" || fail "expected disabled: $MEAL_ROW"

  step "Confirm the disabled route actually 403s (server-side enforcement, not just the listing)"
  RES=$(api GET "/cafeteria/meal-attendance?tenantId=$TENANT_ID&date=$(date +%Y-%m-%d)")
  expect_403 "$RES" && ok "meal-attendance correctly blocked" || fail "expected 403, got: $RES"

  step "Confirm an untouched Cafeteria route still works (guard isn't over-blocking)"
  RES=$(api GET "/cafeteria/menu-items?tenantId=$TENANT_ID")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "menu-items still accessible" || fail "unexpected block: $RES"

  step "Re-enable cafeteria.meal_attendance via PATCH"
  RES=$(api PATCH "/feature-toggles/cafeteria.meal_attendance" "{\"enabled\":true}")
  echo "$RES" | jq -e '.enabled == true' > /dev/null && ok "toggle flipped to enabled" || fail "PATCH didn't take: $RES"

  step "Confirm the route now works with the toggle enabled"
  RES=$(api GET "/cafeteria/meal-attendance?tenantId=$TENANT_ID&date=$(date +%Y-%m-%d)")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "meal-attendance accessible once re-enabled" || fail "still blocked: $RES"

  step "Restore original state — disable it again (leave the demo tenant as it was found)"
  RES=$(api PATCH "/feature-toggles/cafeteria.meal_attendance" "{\"enabled\":false}")
  echo "$RES" | jq -e '.enabled == false' > /dev/null && ok "restored to disabled" || fail "restore failed: $RES"

  step "Confirm Teacher is blocked from PATCH (expect 403 — core-admin:edit required)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api PATCH "/feature-toggles/cafeteria.dietary_restrictions" "{\"enabled\":true}")
  expect_403 "$RES" && ok "Teacher correctly 403'd on toggle edit" || fail "Teacher was NOT blocked: $RES"

  step "Confirm Teacher is blocked from listing toggles too (admin-only, by decision)"
  RES=$(api GET "/feature-toggles")
  expect_403 "$RES" && ok "Teacher correctly 403'd on toggle list" || fail "Teacher was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# Hostel
# ---------------------------------------------------------------------------
test_hostel() {
  step "Hostel — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Clean up any pre-existing test room from a previous run (idempotency)"
  EXISTING_ROOM=$(api GET "/hostel/rooms?tenantId=$TENANT_ID" | jq -r '.[] | select(.building_name=="Test Block" and .room_number=="T1") | .id')
  if [ -n "$EXISTING_ROOM" ] && [ "$EXISTING_ROOM" != "null" ]; then
    api DELETE "/hostel/rooms/$EXISTING_ROOM" > /dev/null
    ok "removed pre-existing test room from a previous run"
  fi

  step "Create a room (capacity 2)"
  RES=$(api POST /hostel/rooms "{\"tenant_id\":\"$TENANT_ID\",\"campus_id\":\"$CAMPUS_ID\",\"building_name\":\"Test Block\",\"room_number\":\"T1\",\"capacity\":2,\"room_type\":\"double\"}")
  ROOM_ID=$(echo "$RES" | jq -r '.id')
  require_id "$ROOM_ID" "room id" "$RES"
  ok "room=$ROOM_ID"

  step "Fetch 3 real student ids from seed data"
  STUDENT_IDS_JSON=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT json_agg(id) FROM (SELECT id FROM students WHERE tenant_id = '$TENANT_ID' LIMIT 3) s;" 2>/dev/null)
  STUDENT_1=$(echo "$STUDENT_IDS_JSON" | jq -r '.[0]')
  STUDENT_2=$(echo "$STUDENT_IDS_JSON" | jq -r '.[1]')
  STUDENT_3=$(echo "$STUDENT_IDS_JSON" | jq -r '.[2]')
  ok "using students=$STUDENT_1,$STUDENT_2,$STUDENT_3"

  step "Fetch the current academic year"
  ACADEMIC_YEAR_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM academic_years WHERE tenant_id = '$TENANT_ID' AND is_current = true LIMIT 1;" 2>/dev/null)
  ok "academic_year=$ACADEMIC_YEAR_ID"

  step "Vacate any pre-existing active allocations for our 3 test students (idempotency across runs)"
  for SID in "$STUDENT_1" "$STUDENT_2" "$STUDENT_3"; do
    LEFTOVER=$(api GET "/hostel/room-allocations?tenantId=$TENANT_ID&studentId=$SID&status=active" | jq -r '.[0].id // empty')
    if [ -n "$LEFTOVER" ]; then
      api PATCH "/hostel/room-allocations/$LEFTOVER/vacate" "{\"vacated_date\":\"$(date +%Y-%m-%d)\"}" > /dev/null
    fi
  done
  ok "cleared any leftover active allocations for test students"

  step "Allocate student 1 to the room"
  RES=$(api POST /hostel/room-allocations "{\"tenant_id\":\"$TENANT_ID\",\"room_id\":\"$ROOM_ID\",\"student_id\":\"$STUDENT_1\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"allocated_date\":\"$(date +%Y-%m-%d)\"}")
  ALLOC_1=$(echo "$RES" | jq -r '.id')
  require_id "$ALLOC_1" "allocation 1 id" "$RES"

  step "Try allocating student 1 AGAIN (expect 400 — student already has an active allocation)"
  RES=$(api POST /hostel/room-allocations "{\"tenant_id\":\"$TENANT_ID\",\"room_id\":\"$ROOM_ID\",\"student_id\":\"$STUDENT_1\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"allocated_date\":\"$(date +%Y-%m-%d)\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected duplicate active allocation" || fail "expected 400, got: $RES"

  step "Allocate student 2 to the room (fills capacity)"
  RES=$(api POST /hostel/room-allocations "{\"tenant_id\":\"$TENANT_ID\",\"room_id\":\"$ROOM_ID\",\"student_id\":\"$STUDENT_2\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"allocated_date\":\"$(date +%Y-%m-%d)\"}")
  ALLOC_2=$(echo "$RES" | jq -r '.id')
  require_id "$ALLOC_2" "allocation 2 id" "$RES"

  step "Try allocating student 3 (expect 400 — room at capacity)"
  RES=$(api POST /hostel/room-allocations "{\"tenant_id\":\"$TENANT_ID\",\"room_id\":\"$ROOM_ID\",\"student_id\":\"$STUDENT_3\",\"academic_year_id\":\"$ACADEMIC_YEAR_ID\",\"allocated_date\":\"$(date +%Y-%m-%d)\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — room at capacity" || fail "expected 400, got: $RES"

  step "Vacate student 1's allocation"
  RES=$(api PATCH "/hostel/room-allocations/$ALLOC_1/vacate" "{\"vacated_date\":\"$(date +%Y-%m-%d)\"}")
  echo "$RES" | jq -e '.status == "vacated"' > /dev/null && ok "correctly vacated" || fail "vacate failed: $RES"

  step "Create a visitor record for student 2 (expect a generated pass_code)"
  RES=$(api POST /hostel/visitors "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT_2\",\"visitor_name\":\"Test Visitor\",\"relation\":\"Uncle\",\"check_in_time\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}")
  VISITOR_ID=$(echo "$RES" | jq -r '.id')
  require_id "$VISITOR_ID" "visitor id" "$RES"
  echo "$RES" | jq -e '.pass_code != null' > /dev/null && ok "digital pass_code generated" || fail "no pass_code: $RES"

  step "Verify the visitor's pass"
  RES=$(api PATCH "/hostel/visitors/$VISITOR_ID/verify" "")
  echo "$RES" | jq -e '.verified == true' > /dev/null && ok "visitor verified" || fail "verify failed: $RES"

  step "Check the visitor out"
  RES=$(api PATCH "/hostel/visitors/$VISITOR_ID/check-out" "{\"check_out_time\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}")
  echo "$RES" | jq -e '.check_out_time != null' > /dev/null && ok "checked out" || fail "check-out failed: $RES"

  step "Create a maintenance request for the room"
  RES=$(api POST /hostel/maintenance-requests "{\"tenant_id\":\"$TENANT_ID\",\"room_id\":\"$ROOM_ID\",\"description\":\"Leaking tap\",\"reported_by\":\"$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c "SELECT id FROM users WHERE tenant_id='$TENANT_ID' AND email='$SCHOOL_ADMIN_EMAIL' LIMIT 1;")\",\"reported_date\":\"$(date +%Y-%m-%d)\"}")
  MAINT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$MAINT_ID" "maintenance request id" "$RES"

  step "Resolve the maintenance request"
  RES=$(api PATCH "/hostel/maintenance-requests/$MAINT_ID/status" "{\"status\":\"resolved\",\"resolved_date\":\"$(date +%Y-%m-%d)\"}")
  echo "$RES" | jq -e '.status == "resolved"' > /dev/null && ok "resolved" || fail "status update failed: $RES"

  step "Record hostel attendance for students 1 and 2"
  RES=$(api POST /hostel/attendance "{\"tenant_id\":\"$TENANT_ID\",\"date\":\"$(date +%Y-%m-%d)\",\"entries\":[{\"student_id\":\"$STUDENT_1\",\"status\":\"present\"},{\"student_id\":\"$STUDENT_2\",\"status\":\"present\"}]}")
  RECORDED_COUNT=$(echo "$RES" | jq 'length')
  [ "$RECORDED_COUNT" == "2" ] && ok "2 attendance records created" || fail "expected 2, got $RECORDED_COUNT: $RES"

  step "Re-submit the SAME day's attendance (expect upsert, not duplicate rows)"
  RES=$(api POST /hostel/attendance "{\"tenant_id\":\"$TENANT_ID\",\"date\":\"$(date +%Y-%m-%d)\",\"entries\":[{\"student_id\":\"$STUDENT_1\",\"status\":\"absent\"}]}")
  echo "$RES" | jq -e '.[0].status == "absent"' > /dev/null && ok "idempotent upsert — status updated, not duplicated" || fail "unexpected: $RES"

  step "Fetch attendance by date"
  RES=$(api GET "/hostel/attendance/by-date?tenantId=$TENANT_ID&date=$(date +%Y-%m-%d)")
  echo "$RES" | jq -e 'length >= 2' > /dev/null && ok "attendance-by-date returned records" || fail "unexpected: $RES"

  step "Create mutual room preferences for students 1 and 3 (should match each other)"
  api POST /hostel/room-preferences "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT_1\",\"preferred_roommate_id\":\"$STUDENT_3\"}" > /dev/null
  api POST /hostel/room-preferences "{\"tenant_id\":\"$TENANT_ID\",\"student_id\":\"$STUDENT_3\",\"preferred_roommate_id\":\"$STUDENT_1\"}" > /dev/null
  ok "mutual preferences created"

  step "Run the matching algorithm"
  RES=$(api POST /hostel/room-preferences/match "{\"tenant_id\":\"$TENANT_ID\"}")
  MATCHED=$(echo "$RES" | jq -r '.matched')
  [ "$MATCHED" -ge 2 ] 2>/dev/null && ok "matched >= 2 students (mutual pair found)" || fail "expected matched >= 2, got: $RES"

  step "Confirm Teacher is blocked from hostel routes (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/hostel/rooms?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"

  step "Set up a Hostel Admin test user (create if it doesn't already exist)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  HOSTEL_ADMIN_EMAIL="hostel.admin1@demo.schoolerp.test"
  EXISTING_USER=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM users WHERE tenant_id='$TENANT_ID' AND email='$HOSTEL_ADMIN_EMAIL' LIMIT 1;" 2>/dev/null)
  if [ -z "$EXISTING_USER" ]; then
    HOSTEL_ADMIN_ROLE_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
      "SELECT id FROM roles WHERE tenant_id='$TENANT_ID' AND name='Hostel Admin' LIMIT 1;" 2>/dev/null)
    RES=$(api POST /users "{\"tenant_id\":\"$TENANT_ID\",\"role_id\":\"$HOSTEL_ADMIN_ROLE_ID\",\"name\":\"Test Hostel Admin\",\"email\":\"$HOSTEL_ADMIN_EMAIL\",\"password\":\"Password123!\"}")
    require_id "$(echo "$RES" | jq -r '.id')" "hostel admin user id" "$RES"
    ok "created Hostel Admin test user"
  else
    ok "Hostel Admin test user already exists from a previous run"
  fi

  step "Confirm Hostel Admin CAN access hostel routes"
  TOKEN=$(login "$HOSTEL_ADMIN_EMAIL")
  RES=$(api GET "/hostel/rooms?tenantId=$TENANT_ID")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "Hostel Admin can list rooms" || fail "unexpected block: $RES"

  step "Confirm Hostel Admin is blocked from an unrelated module (expect 403 on Cafeteria)"
  RES=$(api GET "/cafeteria/menu-items?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Hostel Admin correctly 403'd on Cafeteria" || fail "Hostel Admin was NOT blocked: $RES"

  step "Cleanup — vacate remaining allocation, delete room (student/visitor/maintenance/attendance/preference rows left as harmless test data, same as other modules' convention)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  api PATCH "/hostel/room-allocations/$ALLOC_2/vacate" "{\"vacated_date\":\"$(date +%Y-%m-%d)\"}" > /dev/null
  api DELETE "/hostel/rooms/$ROOM_ID" > /dev/null
  ok "cleaned up this run's room + allocation"
}


# ---------------------------------------------------------------------------
# HR Management
# ---------------------------------------------------------------------------

test_hr_management() {
  step "HR Management — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Create a job opening"
  RES=$(api POST /hr-management/job-openings "{\"tenant_id\":\"$TENANT_ID\",\"title\":\"Math Teacher $(date +%s)\",\"department\":\"Academics\"}")
  JOB_ID=$(echo "$RES" | jq -r '.id')
  require_id "$JOB_ID" "job opening id" "$RES"
  ok "job=$JOB_ID"

  step "Create an applicant against it"
  RES=$(api POST /hr-management/applicants "{\"tenant_id\":\"$TENANT_ID\",\"job_opening_id\":\"$JOB_ID\",\"name\":\"Test Applicant\",\"email\":\"applicant.$(date +%s)@example.com\"}")
  APPLICANT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$APPLICANT_ID" "applicant id" "$RES"
  ok "applicant=$APPLICANT_ID"

  step "Move applicant to screening (ordinary stage change, not hire)"
  RES=$(api PATCH "/hr-management/applicants/$APPLICANT_ID/stage" '{"stage":"screening"}')
  echo "$RES" | jq -e '.stage == "screening"' > /dev/null && ok "stage advanced" || fail "unexpected: $RES"

  step "Try setting stage directly to hired (expect 400 — must use /hire)"
  RES=$(api PATCH "/hr-management/applicants/$APPLICANT_ID/stage" '{"stage":"hired"}')
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — must use /hire" || fail "expected 400, got: $RES"

  step "Hire the applicant"
  RES=$(api POST "/hr-management/applicants/$APPLICANT_ID/hire" "{\"department\":\"Academics\",\"designation\":\"Math Teacher\",\"date_of_joining\":\"$(date +%Y-%m-%d)\"}")
  EMPLOYEE_ID=$(echo "$RES" | jq -r '.employee.id')
  require_id "$EMPLOYEE_ID" "employee id" "$RES"
  echo "$RES" | jq -e '.applicant.stage == "hired"' > /dev/null && ok "applicant correctly marked hired, employee=$EMPLOYEE_ID" || fail "unexpected: $RES"

  step "Try hiring the SAME applicant again (expect 400)"
  RES=$(api POST "/hr-management/applicants/$APPLICANT_ID/hire" '{"department":"Academics","designation":"Math Teacher","date_of_joining":"2026-01-01"}')
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected duplicate hire" || fail "expected 400, got: $RES"

  step "Fetch employees list — confirm the new hire is present"
  RES=$(api GET "/hr-management/employees?tenantId=$TENANT_ID")
  echo "$RES" | jq -e --arg id "$EMPLOYEE_ID" 'any(.[]; .id == $id)' > /dev/null && ok "new employee present in list" || fail "not found: $RES"

  step "Update the employee's department"
  RES=$(api PATCH "/hr-management/employees/$EMPLOYEE_ID" '{"department":"Senior Academics"}')
  echo "$RES" | jq -e '.department == "Senior Academics"' > /dev/null && ok "employee updated" || fail "unexpected: $RES"

  step "Try a leave request with to_date before from_date (expect 400)"
  RES=$(api POST /hr-management/leave-requests "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"leave_type\":\"casual\",\"from_date\":\"2026-08-10\",\"to_date\":\"2026-08-05\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected invalid date range" || fail "expected 400, got: $RES"

  step "Create a valid leave request"
  RES=$(api POST /hr-management/leave-requests "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"leave_type\":\"casual\",\"from_date\":\"2026-08-05\",\"to_date\":\"2026-08-07\"}")
  LEAVE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$LEAVE_ID" "leave request id" "$RES"

  step "Approve the leave request"
  RES=$(api PATCH "/hr-management/leave-requests/$LEAVE_ID/approve" "")
  echo "$RES" | jq -e '.status == "approved" and .approved_by != null' > /dev/null && ok "approved with approver recorded" || fail "unexpected: $RES"

  step "Try approving it again (expect 400 — already decided)"
  RES=$(api PATCH "/hr-management/leave-requests/$LEAVE_ID/approve" "")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected re-decision" || fail "expected 400, got: $RES"

  step "Fetch a real backfilled Teacher's employee id for the multi-entry attendance test"
  TEACHER_EMPLOYEE_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM employees WHERE tenant_id = '$TENANT_ID' AND designation = 'Teacher' LIMIT 1;" 2>/dev/null)
  ok "teacher_employee=$TEACHER_EMPLOYEE_ID"

  step "Record staff attendance for both employees"
  RES=$(api POST /hr-management/attendance "{\"tenant_id\":\"$TENANT_ID\",\"date\":\"$(date +%Y-%m-%d)\",\"entries\":[{\"employee_id\":\"$EMPLOYEE_ID\",\"status\":\"present\"},{\"employee_id\":\"$TEACHER_EMPLOYEE_ID\",\"status\":\"present\"}]}")
  COUNT=$(echo "$RES" | jq 'length')
  [ "$COUNT" == "2" ] && ok "2 attendance records created" || fail "expected 2, got $COUNT: $RES"

  step "Re-submit with a changed status (expect idempotent upsert, not a duplicate)"
  RES=$(api POST /hr-management/attendance "{\"tenant_id\":\"$TENANT_ID\",\"date\":\"$(date +%Y-%m-%d)\",\"entries\":[{\"employee_id\":\"$EMPLOYEE_ID\",\"status\":\"absent\"}]}")
  echo "$RES" | jq -e '.[0].status == "absent"' > /dev/null && ok "idempotent upsert — status updated, not duplicated" || fail "unexpected: $RES"

  step "Create a performance review cycle"
  RES=$(api POST /hr-management/review-cycles "{\"tenant_id\":\"$TENANT_ID\",\"cycle_name\":\"Test Cycle $(date +%s)\",\"start_date\":\"$(date +%Y-%m-%d)\",\"end_date\":\"2026-12-31\"}")
  CYCLE_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CYCLE_ID" "review cycle id" "$RES"

  step "Submit a self-review while the cycle is open"
  RES=$(api POST /hr-management/reviews "{\"tenant_id\":\"$TENANT_ID\",\"cycle_id\":\"$CYCLE_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"reviewer_id\":\"$EMPLOYEE_ID\",\"reviewer_type\":\"self\",\"rating\":4}")
  REVIEW_ID=$(echo "$RES" | jq -r '.id')
  require_id "$REVIEW_ID" "review id" "$RES"

  step "Try calibrating BEFORE the cycle enters calibration (expect 400)"
  RES=$(api PATCH "/hr-management/reviews/$REVIEW_ID/calibrate" '{"calibrated_rating":4}')
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — cycle not in calibration" || fail "expected 400, got: $RES"

  step "Start calibration on the cycle"
  RES=$(api PATCH "/hr-management/review-cycles/$CYCLE_ID/start-calibration" "")
  echo "$RES" | jq -e '.status == "calibrating"' > /dev/null && ok "cycle now calibrating" || fail "unexpected: $RES"

  step "Try submitting a NEW review while calibrating (expect 400 — cycle no longer open)"
  RES=$(api POST /hr-management/reviews "{\"tenant_id\":\"$TENANT_ID\",\"cycle_id\":\"$CYCLE_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"reviewer_id\":\"$EMPLOYEE_ID\",\"reviewer_type\":\"peer\",\"rating\":3}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — cycle not open" || fail "expected 400, got: $RES"

  step "Calibrate the existing review"
  RES=$(api PATCH "/hr-management/reviews/$REVIEW_ID/calibrate" '{"calibrated_rating":5}')
  echo "$RES" | jq -e '.calibrated_rating == 5' > /dev/null && ok "calibrated rating set" || fail "unexpected: $RES"

  step "Close the cycle"
  RES=$(api PATCH "/hr-management/review-cycles/$CYCLE_ID/close" "")
  echo "$RES" | jq -e '.status == "closed"' > /dev/null && ok "cycle closed" || fail "unexpected: $RES"

  step "Create a certification expiring soon (within default 30-day window)"
  NEAR_EXPIRY=$(date -v+20d +%Y-%m-%d 2>/dev/null || date -d "+20 days" +%Y-%m-%d)
  RES=$(api POST /hr-management/certifications "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"certification_name\":\"First Aid\",\"issued_date\":\"2025-01-01\",\"expiry_date\":\"$NEAR_EXPIRY\"}")
  CERT_NEAR_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CERT_NEAR_ID" "near-expiry cert id" "$RES"

  step "Create a certification expiring far in the future (outside the window)"
  FAR_EXPIRY=$(date -v+200d +%Y-%m-%d 2>/dev/null || date -d "+200 days" +%Y-%m-%d)
  RES=$(api POST /hr-management/certifications "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$EMPLOYEE_ID\",\"certification_name\":\"Advanced Pedagogy\",\"issued_date\":\"2025-01-01\",\"expiry_date\":\"$FAR_EXPIRY\"}")
  CERT_FAR_ID=$(echo "$RES" | jq -r '.id')
  require_id "$CERT_FAR_ID" "far-expiry cert id" "$RES"

  step "Fetch expiring-soon — confirm near-expiry present, far-expiry absent"
  RES=$(api GET "/hr-management/certifications/expiring-soon?tenantId=$TENANT_ID")
  echo "$RES" | jq -e --arg id "$CERT_NEAR_ID" 'any(.[]; .id == $id)' > /dev/null && ok "near-expiry cert correctly flagged" || fail "missing: $RES"
  echo "$RES" | jq -e --arg id "$CERT_FAR_ID" 'all(.[]; .id != $id)' > /dev/null && ok "far-expiry cert correctly excluded" || fail "unexpectedly included: $RES"

  step "Cleanup far-expiry cert (has a real DELETE endpoint)"
  api DELETE "/hr-management/certifications/$CERT_FAR_ID" > /dev/null
  ok "removed"

  step "Create a succession plan"
  RES=$(api POST /hr-management/succession-plans "{\"tenant_id\":\"$TENANT_ID\",\"position_employee_id\":\"$EMPLOYEE_ID\"}")
  SUCCESSION_ID=$(echo "$RES" | jq -r '.id')
  require_id "$SUCCESSION_ID" "succession plan id" "$RES"

  step "Update it with a successor and readiness level"
  RES=$(api PATCH "/hr-management/succession-plans/$SUCCESSION_ID" "{\"successor_employee_id\":\"$TEACHER_EMPLOYEE_ID\",\"readiness_level\":\"ready_now\"}")
  echo "$RES" | jq -e '.readiness_level == "ready_now"' > /dev/null && ok "succession plan updated" || fail "unexpected: $RES"

  step "Cleanup succession plan"
  api DELETE "/hr-management/succession-plans/$SUCCESSION_ID" > /dev/null
  ok "removed"

  step "Self-service — logging in as Teacher, confirm /employees/mine resolves to their backfilled record"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/hr-management/employees/mine")
  echo "$RES" | jq -e '.designation == "Teacher"' > /dev/null && ok "Teacher's own employee record resolved" || fail "unexpected: $RES"

  step "Self-service — /leave-requests/mine and /reviews/mine return arrays, no client-supplied id needed"
  RES=$(api GET "/hr-management/leave-requests/mine")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "leave-requests/mine returned an array" || fail "unexpected: $RES"
  RES=$(api GET "/hr-management/reviews/mine")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "reviews/mine returned an array" || fail "unexpected: $RES"

  step "Confirm Teacher is blocked from the general employees list (expect 403)"
  RES=$(api GET "/hr-management/employees?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd on employees list" || fail "Teacher was NOT blocked: $RES"

  step "Set up an HR Manager test user (create if it doesn't already exist)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  HR_MANAGER_EMAIL="hr.manager1@demo.schoolerp.test"
  EXISTING_USER=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM users WHERE tenant_id='$TENANT_ID' AND email='$HR_MANAGER_EMAIL' LIMIT 1;" 2>/dev/null)
  if [ -z "$EXISTING_USER" ]; then
    HR_MANAGER_ROLE_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
      "SELECT id FROM roles WHERE tenant_id='$TENANT_ID' AND name='HR Manager' LIMIT 1;" 2>/dev/null)
    RES=$(api POST /users "{\"tenant_id\":\"$TENANT_ID\",\"role_id\":\"$HR_MANAGER_ROLE_ID\",\"name\":\"Test HR Manager\",\"email\":\"$HR_MANAGER_EMAIL\",\"password\":\"Password123!\"}")
    require_id "$(echo "$RES" | jq -r '.id')" "HR manager user id" "$RES"
    ok "created HR Manager test user"
  else
    ok "HR Manager test user already exists from a previous run"
  fi

  step "Confirm HR Manager CAN access the employees list"
  TOKEN=$(login "$HR_MANAGER_EMAIL")
  RES=$(api GET "/hr-management/employees?tenantId=$TENANT_ID")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "HR Manager can list employees" || fail "unexpected block: $RES"

  step "Confirm HR Manager is blocked from an unrelated module (expect 403 on Cafeteria)"
  RES=$(api GET "/cafeteria/menu-items?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "HR Manager correctly 403'd on Cafeteria" || fail "HR Manager was NOT blocked: $RES"
}

# ---------------------------------------------------------------------------
# Payroll
# ---------------------------------------------------------------------------
test_payroll() {
  step "Payroll — logging in as School Admin"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")

  step "Pick a real active employee to test against (avoids relying on one that's already been terminated by manual testing)"
  TEST_EMPLOYEE_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM employees WHERE tenant_id = '$TENANT_ID' AND status = 'active' LIMIT 1;")
  ok "using employee=$TEST_EMPLOYEE_ID"

  TEST_YEAR=2099
  TEST_MONTH_A=1
  TEST_MONTH_B=2

  step "Clean up any pre-existing test data from previous runs (idempotency)"
  for M in $TEST_MONTH_A $TEST_MONTH_B; do
    OLD_RUN_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
      "SELECT id FROM payroll_runs WHERE tenant_id = '$TENANT_ID' AND month = $M AND year = $TEST_YEAR;")
    if [ -n "$OLD_RUN_ID" ]; then
      docker exec school-erp-postgres psql -U school_erp -d school_erp -c "DELETE FROM payslips WHERE payroll_run_id = '$OLD_RUN_ID';" > /dev/null
      docker exec school-erp-postgres psql -U school_erp -d school_erp -c "DELETE FROM payroll_runs WHERE id = '$OLD_RUN_ID';" > /dev/null
    fi
  done
  docker exec school-erp-postgres psql -U school_erp -d school_erp -c \
    "DELETE FROM loan_advances WHERE tenant_id = '$TENANT_ID' AND employee_id = '$TEST_EMPLOYEE_ID';" > /dev/null
  docker exec school-erp-postgres psql -U school_erp -d school_erp -c \
    "DELETE FROM salary_structures WHERE tenant_id = '$TENANT_ID' AND employee_id = '$TEST_EMPLOYEE_ID';" > /dev/null
  ok "cleared leftover test data"

  step "Confirm PayrollSettings default (professional_tax_amount = 200)"
  RES=$(api GET "/payroll/settings?tenantId=$TENANT_ID")
  echo "$RES" | jq -e '.professional_tax_amount == "200"' > /dev/null && ok "default PT confirmed" || fail "expected 200: $RES"

  step "Create a salary structure (basic 15000, hra 3000, special_allowance 1000 — gross 19000, under the ESI threshold)"
  RES=$(api POST /payroll/salary-structures "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$TEST_EMPLOYEE_ID\",\"basic_salary\":\"15000\",\"hra\":\"3000\",\"special_allowance\":\"1000\",\"effective_from\":\"2026-01-01\",\"bank_account_number\":\"1234567890\",\"bank_ifsc_code\":\"HDFC0001234\",\"bank_account_holder_name\":\"Test Employee\"}")
  require_id "$(echo "$RES" | jq -r '.id')" "salary structure id" "$RES"

  step "Create payroll run A ($TEST_MONTH_A/$TEST_YEAR)"
  RES=$(api POST /payroll/runs "{\"tenant_id\":\"$TENANT_ID\",\"month\":$TEST_MONTH_A,\"year\":$TEST_YEAR}")
  RUN_A_ID=$(echo "$RES" | jq -r '.id')
  require_id "$RUN_A_ID" "run A id" "$RES"

  step "Process run A — verify exact statutory calculation"
  RES=$(api POST "/payroll/runs/$RUN_A_ID/process" "{}")
  PAYSLIP=$(echo "$RES" | jq --arg eid "$TEST_EMPLOYEE_ID" '.payslips[] | select(.employee_id == $eid)')
  echo "$PAYSLIP" | jq -e '.gross_salary == "19000"' > /dev/null && ok "gross correct (19000)" || fail "unexpected gross: $PAYSLIP"
  echo "$PAYSLIP" | jq -e '.pf_employee == "1800" and .pf_employer == "1800"' > /dev/null && ok "PF correct (1800/1800)" || fail "unexpected PF: $PAYSLIP"
  echo "$PAYSLIP" | jq -e '.esi_employee == "142.5" and .esi_employer == "617.5"' > /dev/null && ok "ESI correct (eligible, gross under threshold)" || fail "unexpected ESI: $PAYSLIP"
  echo "$PAYSLIP" | jq -e '.net_salary == "16857.5"' > /dev/null && ok "net salary correct (16857.5)" || fail "unexpected net: $PAYSLIP"
  echo "$RES" | jq -e --arg eid "$TEST_EMPLOYEE_ID" '.skippedEmployeeIds | index($eid) == null' > /dev/null && ok "test employee correctly NOT skipped" || fail "test employee was unexpectedly skipped: $RES"

  step "Try re-processing run A (expect 400)"
  RES=$(api POST "/payroll/runs/$RUN_A_ID/process" "{}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected re-process" || fail "expected 400, got: $RES"

  step "Create payroll run B ($TEST_MONTH_B/$TEST_YEAR)"
  RES=$(api POST /payroll/runs "{\"tenant_id\":\"$TENANT_ID\",\"month\":$TEST_MONTH_B,\"year\":$TEST_YEAR}")
  RUN_B_ID=$(echo "$RES" | jq -r '.id')
  require_id "$RUN_B_ID" "run B id" "$RES"

  step "Try marking run B disbursed while still draft (expect 400)"
  RES=$(api PATCH "/payroll/runs/$RUN_B_ID/mark-disbursed" "")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected — must process before disbursing" || fail "expected 400, got: $RES"

  step "Mark run A disbursed (it's already processed)"
  RES=$(api PATCH "/payroll/runs/$RUN_A_ID/mark-disbursed" "")
  echo "$RES" | jq -e '.status == "disbursed"' > /dev/null && ok "run A disbursed" || fail "unexpected: $RES"

  step "Create a loan/advance for the test employee"
  RES=$(api POST /payroll/loans "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$TEST_EMPLOYEE_ID\",\"amount\":\"5000\",\"monthly_recovery_amount\":\"2000\"}")
  LOAN_ID=$(echo "$RES" | jq -r '.id')
  require_id "$LOAN_ID" "loan id" "$RES"

  step "Try creating a SECOND active loan for the same employee (expect 400)"
  RES=$(api POST /payroll/loans "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$TEST_EMPLOYEE_ID\",\"amount\":\"1000\",\"monthly_recovery_amount\":\"500\"}")
  echo "$RES" | jq -e '.statusCode == 400' > /dev/null && ok "correctly rejected second active loan" || fail "expected 400, got: $RES"

  step "Process run B — verify loan auto-recovery"
  RES=$(api POST "/payroll/runs/$RUN_B_ID/process" "{}")
  PAYSLIP_B=$(echo "$RES" | jq --arg eid "$TEST_EMPLOYEE_ID" '.payslips[] | select(.employee_id == $eid)')
  echo "$PAYSLIP_B" | jq -e '.loan_deduction == "2000"' > /dev/null && ok "loan auto-deducted (2000)" || fail "unexpected loan_deduction: $PAYSLIP_B"
  echo "$PAYSLIP_B" | jq -e '.net_salary == "14857.5"' > /dev/null && ok "net salary correctly reduced (14857.5)" || fail "unexpected net: $PAYSLIP_B"

  step "Confirm loan balance decremented correctly, still active"
  RES=$(api GET "/payroll/loans?tenantId=$TENANT_ID&employeeId=$TEST_EMPLOYEE_ID")
  echo "$RES" | jq -e '.[0].remaining_balance == "3000" and .[0].status == "active"' > /dev/null && ok "loan balance=3000, still active" || fail "unexpected: $RES"

  step "Generate bank file for run A (disbursed) — confirm CSV content"
  RES=$(api GET "/payroll/runs/$RUN_A_ID/bank-file")
  echo "$RES" | grep -q "$TEST_EMPLOYEE_ID" && echo "$RES" | grep -q "16857.5" && ok "bank file contains correct employee row" || fail "bank file missing expected data: $RES"

  step "Full & final settlement — create (dues 5000, deductions 1000)"
  RES=$(api POST /payroll/settlements "{\"tenant_id\":\"$TENANT_ID\",\"employee_id\":\"$TEST_EMPLOYEE_ID\",\"last_working_date\":\"2026-08-31\",\"dues\":\"5000\",\"deductions\":\"1000\"}")
  SETTLEMENT_ID=$(echo "$RES" | jq -r '.id')
  require_id "$SETTLEMENT_ID" "settlement id" "$RES"
  echo "$RES" | jq -e '.net_settlement_amount == "4000"' > /dev/null && ok "net settlement correct (4000)" || fail "unexpected: $RES"

  step "Process the settlement — confirm the cross-module write terminates the Employee"
  RES=$(api PATCH "/payroll/settlements/$SETTLEMENT_ID/process" "")
  echo "$RES" | jq -e '.status == "processed"' > /dev/null && ok "settlement processed" || fail "unexpected: $RES"
  RES=$(api GET "/hr-management/employees/$TEST_EMPLOYEE_ID")
  echo "$RES" | jq -e '.status == "terminated"' > /dev/null && ok "cross-module write confirmed — employee now terminated" || fail "employee status not updated: $RES"

  step "Toggle professional_tax_amount, then restore the tenant default (leaves settings as found)"
  RES=$(api PATCH "/payroll/settings?tenantId=$TENANT_ID" '{"professional_tax_amount":"250"}')
  echo "$RES" | jq -e '.professional_tax_amount == "250"' > /dev/null && ok "settings updated" || fail "unexpected: $RES"
  RES=$(api PATCH "/payroll/settings?tenantId=$TENANT_ID" '{"professional_tax_amount":"200"}')
  echo "$RES" | jq -e '.professional_tax_amount == "200"' > /dev/null && ok "settings restored to default" || fail "restore failed: $RES"

  step "Confirm Teacher is blocked from payroll routes (expect 403)"
  TOKEN=$(login "$TEACHER_EMAIL")
  RES=$(api GET "/payroll/runs?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Teacher correctly 403'd" || fail "Teacher was NOT blocked: $RES"

  step "Set up a Payroll Admin test user (create if it doesn't already exist)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  PAYROLL_ADMIN_EMAIL="payroll.admin1@demo.schoolerp.test"
  EXISTING_USER=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
    "SELECT id FROM users WHERE tenant_id='$TENANT_ID' AND email='$PAYROLL_ADMIN_EMAIL' LIMIT 1;")
  if [ -z "$EXISTING_USER" ]; then
    PAYROLL_ADMIN_ROLE_ID=$(docker exec school-erp-postgres psql -U school_erp -d school_erp -t -A -c \
      "SELECT id FROM roles WHERE tenant_id='$TENANT_ID' AND name='Payroll Admin' LIMIT 1;")


    RES=$(api POST /users "{\"tenant_id\":\"$TENANT_ID\",\"role_id\":\"$PAYROLL_ADMIN_ROLE_ID\",\"name\":\"Test Payroll Admin\",\"email\":\"$PAYROLL_ADMIN_EMAIL\",\"password\":\"Password123!\"}")
    require_id "$(echo "$RES" | jq -r '.id')" "payroll admin user id" "$RES"
    ok "created Payroll Admin test user"
  else
    ok "Payroll Admin test user already exists from a previous run"
  fi

  step "Confirm Payroll Admin CAN access payroll routes"
  TOKEN=$(login "$PAYROLL_ADMIN_EMAIL")
  RES=$(api GET "/payroll/runs?tenantId=$TENANT_ID")
  echo "$RES" | jq -e 'type == "array"' > /dev/null && ok "Payroll Admin can list runs" || fail "unexpected block: $RES"

  step "Confirm Payroll Admin is blocked from an unrelated module (expect 403 on Cafeteria)"
  RES=$(api GET "/cafeteria/menu-items?tenantId=$TENANT_ID")
  expect_403 "$RES" && ok "Payroll Admin correctly 403'd on Cafeteria" || fail "Payroll Admin was NOT blocked: $RES"

  step "Cleanup — restore the test employee's status back to active (undoing this test's own termination)"
  TOKEN=$(login "$SCHOOL_ADMIN_EMAIL")
  api PATCH "/hr-management/employees/$TEST_EMPLOYEE_ID" '{"status":"active"}' > /dev/null
  ok "restored employee status to active"
}
# ---------------------------------------------------------------------------
# ADD NEW MODULES HERE — copy a test_* function above, rename it, adjust
# endpoints, then add it to the dispatch list below.
# ---------------------------------------------------------------------------
    
# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
MODULE="${1:-all}"

case "$MODULE" in
  core-admin)            test_core_admin ;;
  student-lifecycle)     test_student_lifecycle ;;
  admissions)            test_admissions ;;
  academic-management)   test_academic_management ;;
  attendance)            test_attendance ;;
  fee-management)        test_fee_management ;;
  communication)         test_communication ;;
  examinations)          test_examinations ;;
  lms)                   test_lms ;;
  library)               test_library ;;
  transportation)        test_transportation ;;
  cafeteria)             test_cafeteria ;;
  health-wellness)       test_health_wellness ;;
  inventory-assets)      test_inventory_assets ;;
  feature-toggles)       test_feature_toggles ;; 
  hostel)                test_hostel ;;
  hr-management)         test_hr_management ;;
  payroll)               test_payroll ;;
  all)
    test_core_admin
    test_student_lifecycle
    test_admissions
    test_academic_management
    test_attendance
    test_fee_management
    test_communication
    test_examinations
    test_lms
    test_library
    test_transportation
    test_cafeteria
    test_health_wellness
    test_inventory_assets
    test_feature_toggles
    test_hostel
    test_hr_management
    test_payroll
    ;;
  *)
    echo "Unknown module '$MODULE'. Available: core-admin, student-lifecycle, admissions, academic-management, attendance, fee-management, communication, examinations, lms, library, transportation, cafeteria, health-wellness, inventory-assets, feature-toggles, hostel, hr-management, all"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Done.${NC}"
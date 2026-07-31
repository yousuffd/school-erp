#!/usr/bin/env bash
set -euo pipefail

API_BASE="http://localhost:3000/api/v1"
SUPER_ADMIN_EMAIL="superadmin1@demo.schoolerp.test"
SUPER_ADMIN_PASSWORD="Password123!"

echo "== Logging in as Super Admin (platform login, no subdomain) =="
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "FAIL: could not extract token from login response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo "Token acquired."
echo

check_status() {
  local method="$1" path="$2" expected="$3" label="$4"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_BASE$path" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$status" = "$expected" ]; then
    echo "PASS: $label -> got $status (expected $expected)"
  else
    echo "FAIL: $label -> got $status (expected $expected)"
  fi
}

echo "== Tenant-operational endpoints: expect 403 =="
check_status GET "/payroll/settings" 403 "GET /payroll/settings"
check_status GET "/hr-management/employees" 403 "GET /hr-management/employees"
check_status GET "/library/books" 403 "GET /library/books"
check_status GET "/transportation/vehicles" 403 "GET /transportation/vehicles"
check_status GET "/health-wellness/profiles" 403 "GET /health-wellness/profiles"
check_status GET "/inventory-assets/items" 403 "GET /inventory-assets/items"
check_status GET "/cafeteria/menu-items" 403 "GET /cafeteria/menu-items"
check_status GET "/students" 403 "GET /students"
check_status GET "/hostel/rooms" 403 "GET /hostel/rooms"
check_status GET "/exams" 403 "GET /exams"
check_status GET "/activities" 403 "GET /activities"
check_status GET "/discipline/incidents" 403 "GET /discipline/incidents"
check_status GET "/documents" 403 "GET /documents"
check_status GET "/alumni/profiles" 403 "GET /alumni/profiles"

echo
echo "== Platform-admin / tenant-provisioning endpoints: expect NOT 403 =="
check_status GET "/platform-admin/tenants" 200 "GET /platform-admin/tenants"
check_status POST "/tenants" 400 "POST /tenants (empty body — 400 is fine, just not 403)"

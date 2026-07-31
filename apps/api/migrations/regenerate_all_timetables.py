#!/usr/bin/env python3
"""
Wipes ALL 10 real Grade 1-5 classes' timetable_slots and regenerates them
under the one-teacher-one-subject model, reading the actual persisted
specialization mapping (built by assign_specializations.py) rather than
hardcoding teacher assignments here. Run AFTER assign_specializations.py.

Run locally: python3 regenerate_all_timetables.py
"""
import json
import urllib.request
import urllib.error

API_BASE = "http://localhost:3000/api/v1"
TENANT_ID = "fa0edb4d-37ca-4057-83b1-59bb6e8cb489"
LOGIN_EMAIL = "school.admin1@demo.schoolerp.test"
LOGIN_PASSWORD = "Password123!"

SUBJECT_IDS = {
    "Mathematics": "db1a8db0-27d9-4048-86e2-db8fe82165cc",
    "English": "8f3b1133-8741-46df-beb2-82a3259df776",
    "Social Studies": "c3d870bd-6e72-45e5-8bad-5976e9e19087",
    "Biology": "798d5d0a-fae0-4883-88c8-1c129e004776",
    "Chemistry": "73d45cb2-a564-493b-baa5-dbd2a8a4b48d",
    "Physics": "b30a20bf-eaf9-4daf-b6e3-240c86165385",
    "Hindi": "67c0b98e-147f-4053-8343-f6910aad1bff",
    "Kannada": "96b5b042-de38-4ba8-a1c6-a514a1b423e4",
    "German": "bac677ee-c4e3-42dc-a7de-c9325eda0f86",
    "Computer Science": "045b30ed-acf9-4655-ad86-0c745b03b78b",
    "Artificial Intelligence": "b7ee30c9-11b5-415e-ab1e-3c5a244c5e6c",
}
SPANISH_ID = "06d0df58-1870-4f67-9167-e5e478acf77b"
FRENCH_ID = "95bd9aa0-af61-41dd-9036-af93d280ef10"

# Periods/week per core subject (11 subjects, full coverage, confirmed).
# Social Studies kept at 4 (zero slack, per explicit decision) -- any
# resulting gap gets flagged for a manual single-slot fix like before.
CORE_PERIODS = {
    "Mathematics": 6, "English": 5, "Social Studies": 4,
    "Biology": 3, "Chemistry": 3, "Physics": 3, "Hindi": 3,
    "Kannada": 2, "German": 2, "Computer Science": 2, "Artificial Intelligence": 2,
}
ELECTIVE_PERIODS = 3

ALL_CLASSES = [
    "913c6192-cd80-412f-b256-d992b5b23fa0",  # 1A
    "32026ab4-7f6d-4c13-a932-6e0435d6b83b",  # 1B
    "02cbf67f-0bf9-44db-a70f-570543c3fe30",  # 2A
    "b142e5bb-e264-4626-88c0-e7936f7d9dd0",  # 2B
    "0e6e928d-88cd-44b6-8eac-b4781ce6e57c",  # 3A
    "9f9a198d-db67-4a4d-8066-21a801390350",  # 3B
    "4776313e-1b23-4f32-9de9-7fa5bb232e69",  # 4A
    "fc107e2c-a4cb-4c38-b693-bc2b1d3e2e75",  # 4B
    "afb4e048-274a-4fb4-8a72-217c2fee4fdc",  # 5A
    "e546c55f-a444-4ce2-8c5a-4a7a5cca6f80",  # 5B
]
CLASS_4B_ID = "fc107e2c-a4cb-4c38-b693-bc2b1d3e2e75"

# Classes needing 2 teachers for one subject: split the 10 classes into two
# fixed groups. Groups are deterministic (first 5 / last 5 in ALL_CLASSES
# order above) so this script is idempotent/re-runnable.
GROUP_A = set(ALL_CLASSES[:5])
GROUP_B = set(ALL_CLASSES[5:])


def api(method, path, token=None, body=None):
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw.decode(errors="replace")


def main():
    print("Logging in...")
    status, resp = api("POST", "/auth/login", body={
        "tenant_id": TENANT_ID, "email": LOGIN_EMAIL, "password": LOGIN_PASSWORD,
    })
    if status not in (200, 201):
        print("LOGIN FAILED:", status, resp)
        return
    token = resp["access_token"]
    print("Logged in OK.\n")

    # ---- Step 1: read the real specialization mapping ----
    print("Reading teacher-subject specializations...")
    status, specs = api("GET", f"/teacher-subject-specializations?tenantId={TENANT_ID}", token=token)
    if status != 200:
        print("FAILED to fetch specializations:", status, specs)
        return

    subject_to_teachers = {}
    for spec in specs:
        subject_to_teachers.setdefault(spec["subject_id"], []).append(spec["teacher_id"])
    print(f"  Loaded {len(specs)} specializations across {len(subject_to_teachers)} subjects.\n")

    def teacher_for(subject_id, class_id):
        teachers = subject_to_teachers.get(subject_id, [])
        if not teachers:
            return None
        if len(teachers) == 1:
            return teachers[0]
        # 2+ teachers for this subject -- split by fixed class group.
        return teachers[0] if class_id in GROUP_A else teachers[1]

    # ---- Step 2: ensure every class has exactly one elective offering ----
    print("Checking elective offerings for all 10 classes...")
    for class_id in ALL_CLASSES:
        s, offerings = api("GET", f"/class-elective-offerings?schoolClassId={class_id}", token=token)
        if s == 200 and offerings:
            print(f"  {class_id}: already has an offering, leaving as-is.")
            continue
        if class_id == CLASS_4B_ID:
            # 4B had no formal offering, but its prior (now-wiped) timetable
            # had an informal French period -- honoring that, not inventing
            # a fresh pick.
            elective_id = FRENCH_ID
        else:
            print(f"  {class_id}: WARNING -- no offering found and no fallback rule; skipping elective for this class.")
            continue
        s2, r2 = api("POST", "/class-elective-offerings", token=token, body={
            "tenant_id": TENANT_ID, "school_class_id": class_id, "subject_id": elective_id,
        })
        print(f"  {class_id}: created offering -> status {s2}")

    # ---- Step 3: fetch each class's actual elective subject_id ----
    class_elective = {}
    for class_id in ALL_CLASSES:
        s, offerings = api("GET", f"/class-elective-offerings?schoolClassId={class_id}", token=token)
        if s == 200 and offerings:
            class_elective[class_id] = offerings[0]["subject_id"]
        else:
            print(f"  WARNING: {class_id} still has no elective offering -- will be skipped for elective periods.")

    # ---- Step 4: wipe ALL existing slots for all 10 classes ----
    print("\nWiping existing timetable slots for all 10 classes...")
    for class_id in ALL_CLASSES:
        s, slots = api("GET", f"/timetable/by-class/{class_id}", token=token)
        if s == 200 and slots:
            print(f"  {class_id}: deleting {len(slots)} slots")
            for slot in slots:
                api("DELETE", f"/timetable/{slot['id']}", token=token)
        else:
            print(f"  {class_id}: nothing to delete")

    # ---- Step 5: build requirements for all 10 classes ----
    print("\nBuilding requirements...")
    requirements = []
    for class_id in ALL_CLASSES:
        for subject_name, periods in CORE_PERIODS.items():
            subject_id = SUBJECT_IDS[subject_name]
            teacher_id = teacher_for(subject_id, class_id)
            if teacher_id is None:
                print(f"  WARNING: no teacher assigned for {subject_name}; skipping for {class_id}")
                continue
            requirements.append({
                "school_class_id": class_id, "subject_id": subject_id,
                "teacher_id": teacher_id, "periods_per_week": periods,
            })
        elective_id = class_elective.get(class_id)
        if elective_id:
            teacher_id = teacher_for(elective_id, class_id)
            if teacher_id:
                requirements.append({
                    "school_class_id": class_id, "subject_id": elective_id,
                    "teacher_id": teacher_id, "periods_per_week": ELECTIVE_PERIODS,
                })

    print(f"Total requirement rows: {len(requirements)}")

    # ---- Step 6: generate ----
    print("\nCalling POST /timetable/generate...")
    status, result = api("POST", "/timetable/generate", token=token, body={
        "tenant_id": TENANT_ID,
        "requirements": requirements,
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "periods_per_day": 8,
    })
    if status not in (200, 201):
        print("GENERATE FAILED:", status, result)
        return

    created = result.get("created", [])
    unscheduled = result.get("unscheduled", [])
    print(f"\nCreated: {len(created)} slots")
    print(f"Unscheduled: {len(unscheduled)} requirements")
    if unscheduled:
        print("\n--- UNSCHEDULED DETAIL ---")
        for u in unscheduled:
            print(f"  class={u['requirement']['school_class_id']} subject={u['requirement']['subject_id']} "
                  f"teacher={u['requirement']['teacher_id']} placed={u['periods_placed']}/{u['periods_requested']}")
    else:
        print("\nAll requirements placed cleanly.")

    print("\nDone.")


if __name__ == "__main__":
    main()

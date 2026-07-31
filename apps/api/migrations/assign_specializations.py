#!/usr/bin/env python3
"""
Assigns each of the 15 real teachers to exactly one subject specialization,
via the new POST /teacher-subject-specializations endpoint.

Run locally: python3 assign_specializations.py
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
    "Spanish": "06d0df58-1870-4f67-9167-e5e478acf77b",
    "French": "95bd9aa0-af61-41dd-9036-af93d280ef10",
}

# (teacher_id, name, subject) -- 14 of 15 teachers used; Aditya Joshi's slot
# was reassigned to English (was originally a swap-in for a non-teacher
# account caught during verification), so 20dd588f is used, not left idle.
# The 15th teacher (whichever remains unused) is simply not needed under
# this model -- fine, not every teacher must have a specialization.
ASSIGNMENTS = [
    ("cb6b099d-969f-4e95-a837-b75103e7803a", "Meera Krishnan", "Mathematics"),
    ("c93160ae-c216-4b25-9c65-ace701086823", "Suresh Bhandari", "Mathematics"),
    ("d9b59229-679b-4f6d-9e83-009afa073981", "Kavitha Iyer", "English"),
    ("20dd588f-11ed-4733-b15e-7f8da4b7af95", "Aditya Joshi", "English"),
    ("d7d80683-2d93-419a-ac1d-346a8495199f", "Neha Rao", "Social Studies"),
    ("0d579d3c-18a8-4a2e-9c6b-c57ca263e3d3", "Rohan Mehta", "Biology"),
    ("d62cf859-355f-415f-a0ed-c79b238380d3", "Ananya Desai", "Chemistry"),
    ("23ab165d-b2a4-4be9-8aa0-1ffcef2111eb", "Vikram Nair", "Physics"),
    ("bd48bfef-a2da-4227-a4c7-2f9bcc06c143", "Priyanka Iyer", "Hindi"),
    ("80cbeb91-90a2-4eef-9f01-30398880b38d", "Arjun Kapoor", "Kannada"),
    ("6f858e33-8159-4691-8500-88dfe638fe6c", "Kavya Menon", "German"),
    ("a0f04227-dc93-48c1-a9db-b84ff48f76b9", "Siddharth Rao", "Computer Science"),
    ("5dce2f48-81b0-4815-954e-576c9adf0c6e", "Meera Pillai", "Artificial Intelligence"),
    ("04f18ff5-ee72-489b-a21e-afe6721089ff", "Karan Bhatt", "Spanish"),
    ("fa408a10-27e8-4ecb-b79c-3f6daad51925", "Ritu Chawla", "French"),
]


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

    for teacher_id, name, subject in ASSIGNMENTS:
        subject_id = SUBJECT_IDS[subject]
        s, r = api("POST", "/teacher-subject-specializations", token=token, body={
            "tenant_id": TENANT_ID, "teacher_id": teacher_id, "subject_id": subject_id,
        })
        status_str = "OK" if s in (200, 201) else f"FAILED ({s}): {r}"
        print(f"  {name:20s} -> {subject:24s} {status_str}")

    print("\nVerifying full mapping...")
    s, all_specs = api("GET", f"/teacher-subject-specializations?tenantId={TENANT_ID}", token=token)
    print(f"Total specializations on record: {len(all_specs) if s == 200 else 'FETCH FAILED'}")


if __name__ == "__main__":
    main()

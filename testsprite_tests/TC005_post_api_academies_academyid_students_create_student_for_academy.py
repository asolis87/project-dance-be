import requests
from uuid import uuid4

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
ORIGIN_HEADER = {"Origin": "http://localhost:3000"}

def test_post_api_academies_academyid_students_create_student_for_academy():
    session = requests.Session()

    # Step 1: Register a new user with a fresh random email
    signup_email = f"test_{uuid4()}@example.com"
    signup_payload = {
        "email": signup_email,
        "password": "securepassword123",
        "name": "Test User"
    }
    signup_headers = {"Origin": "http://localhost:3000"}
    signup_response = session.post(
        f"{BASE_URL}/api/auth/sign-up/email",
        json=signup_payload,
        headers=signup_headers,
        timeout=TIMEOUT
    )
    assert signup_response.status_code == 200, f"Sign-up failed: {signup_response.text}"

    # Extract cookies from signup response for authentication reuse
    cookies = signup_response.cookies.get_dict()
    cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
    auth_headers = {
        "Cookie": cookie_header,
        "Origin": "http://localhost:3000"
    }

    # Step 2: Create an Organization (Academy) with a unique slug
    org_slug = f"test-academy-{uuid4()}"
    org_payload = {
        "name": "Test Academy",
        "slug": org_slug
    }
    org_response = session.post(
        f"{BASE_URL}/api/auth/organization/create",
        json=org_payload,
        headers=auth_headers,
        timeout=TIMEOUT
    )
    assert org_response.status_code == 200, f"Organization creation failed: {org_response.text}"

    academy_id = org_response.json().get("id")
    assert academy_id is not None, "academyId not found in organization creation response"

    # Step 3: Prepare student creation payload with fresh random student email
    student_email = f"test_{uuid4()}@example.com"
    student_payload = {
        "name": "New Student",
        "email": student_email
    }

    # Step 4: POST to create a new student in the academy
    try:
        create_student_response = session.post(
            f"{BASE_URL}/api/academies/{academy_id}/students",
            json=student_payload,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert create_student_response.status_code == 200, f"Create student failed: {create_student_response.text}"
        response_json = create_student_response.json()
        student_data = response_json.get("data") or response_json
        # Validate returned student object contains expected fields and values
        assert student_data.get("name") == student_payload["name"], "Student name mismatch"
        assert student_data.get("email") == student_payload["email"], "Student email mismatch"
        assert "id" in student_data and student_data["id"], "Student id missing or empty"

    finally:
        # Cleanup: delete the created student to avoid residual data
        student_id = None
        try:
            if 'create_student_response' in locals():
                response_json = create_student_response.json()
                student_data = response_json.get("data") or response_json
                student_id = student_data.get("id")
        except Exception:
            pass

        if student_id:
            del_response = session.delete(
                f"{BASE_URL}/api/academies/{academy_id}/students/{student_id}",
                headers=auth_headers,
                timeout=TIMEOUT
            )
            # It's OK if delete fails for some reason; no assert here

test_post_api_academies_academyid_students_create_student_for_academy()

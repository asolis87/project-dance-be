import requests
from uuid import uuid4

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_academy_instructors_list():
    headers = {
        "Origin": BASE_URL
    }
    # Step 1: Sign up a new user with fresh random email
    signup_email = f"test_{uuid4()}@example.com"
    signup_payload = {
        "email": signup_email,
        "password": "securepassword123",
        "name": "Test User"
    }
    signup_resp = requests.post(
        f"{BASE_URL}/api/auth/sign-up/email",
        json=signup_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.text}"
    # Extract cookies from signup response for session
    cookies = signup_resp.cookies

    # Step 2: Create Organization (Academy)
    org_slug = f"test-academy-{uuid4()}"
    org_payload = {
        "name": "Test Academy",
        "slug": org_slug
    }
    org_headers = headers.copy()
    org_resp = requests.post(
        f"{BASE_URL}/api/auth/organization/create",
        json=org_payload,
        headers=org_headers,
        cookies=cookies,
        timeout=TIMEOUT
    )
    assert org_resp.status_code == 200, f"Create organization failed: {org_resp.text}"
    org_data = org_resp.json()
    academy_id = org_data.get("id")
    assert academy_id is not None, "Organization ID not returned"

    try:
        # Step 3: GET /api/academies/:academyId/instructors with authenticated cookies
        instructors_url = f"{BASE_URL}/api/academies/{academy_id}/instructors"
        get_headers = {
            "Origin": BASE_URL
        }
        resp = requests.get(
            instructors_url,
            headers=get_headers,
            cookies=cookies,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"GET instructors failed: {resp.text}"
        instructors_list = resp.json()
        assert isinstance(instructors_list, list), "Instructors response is not a list"

    finally:
        # Cleanup: no direct delete endpoint specified for organization or instructors, 
        # assume no need or not part of test.
        pass

test_get_academy_instructors_list()
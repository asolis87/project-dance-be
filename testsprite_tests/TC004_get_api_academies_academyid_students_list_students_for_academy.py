import requests
from uuid import uuid4

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_get_academy_students_list():
    headers_origin = {"Origin": "http://localhost:3000"}
    session = requests.Session()

    # Step 1: Sign up a new user to get user credentials
    signup_email = f"test_{uuid4()}@example.com"
    signup_payload = {
        "email": signup_email,
        "password": "securepassword123",
        "name": "Test User"
    }
    signup_resp = session.post(f"{BASE_URL}/api/auth/sign-up/email", json=signup_payload, headers=headers_origin, timeout=TIMEOUT)
    assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.text}"

    # Step 2: Login to get the token
    login_payload = {
        "email": signup_email,
        "password": "securepassword123"
    }
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers_origin, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    try:
        login_data = login_resp.json()
        # Attempt to get token from common keys if present
        token = login_data.get("token") or login_data.get("accessToken") or login_data.get("jwt")
        if not token:
            # fallback if login_data is dict but no token found
            token = None
    except Exception:
        # If response is not json, use response text as token
        token = login_resp.text.strip()

    assert token, "Token missing in login response"

    # Step 3: Use known academyId for testing
    # Replace this with a valid academy ID for actual test environment
    academy_id = "test-academy-id"

    # Step 4: GET /api/academies/:academyId/students with Bearer token
    get_students_url = f"{BASE_URL}/api/academies/{academy_id}/students"
    get_headers = {
        "Authorization": f"Bearer {token}",
        "Origin": "http://localhost:3000"
    }
    get_resp = requests.get(get_students_url, headers=get_headers, timeout=TIMEOUT)
    assert get_resp.status_code == 200, f"Failed to get students list: {get_resp.text}"

    students_list = get_resp.json()
    assert isinstance(students_list, list), "Response is not a list"


test_get_academy_students_list()

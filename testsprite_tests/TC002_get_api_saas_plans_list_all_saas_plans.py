import requests
from uuid import uuid4

BASE_URL = "http://localhost:3000"
SIGNUP_URL = f"{BASE_URL}/api/auth/sign-up/email"
SAAS_PLANS_URL = f"{BASE_URL}/api/saas/plans"
TIMEOUT = 30

def test_get_api_saas_plans_list_all_saas_plans():
    # Step 1: Register a new user to conform with authentication instructions
    random_email = f"test_{uuid4()}@example.com"
    signup_payload = {
        "email": random_email,
        "password": "securepassword123",
        "name": "Test User"
    }
    headers_signup = {
        "Origin": BASE_URL,
        "Content-Type": "application/json"
    }
    try:
        signup_response = requests.post(
            SIGNUP_URL,
            json=signup_payload,
            headers=headers_signup,
            timeout=TIMEOUT
        )
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.text}"
    except requests.RequestException as e:
        assert False, f"Signup request failed with exception: {e}"

    # Extract cookies from signup response for any authenticated requests if required
    cookies = signup_response.cookies.get_dict()

    # Step 2: Call GET /api/saas/plans endpoint (no auth required per PRD)
    try:
        response = requests.get(SAAS_PLANS_URL, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"GET /api/saas/plans request failed with exception: {e}"

    # Step 3: Validate response
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    try:
        plans = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(plans, list), "Response JSON is not a list"
    # Optionally, check that each item in the list is a dict (Plan object)
    for plan in plans:
        assert isinstance(plan, dict), "Each plan should be a dictionary"

test_get_api_saas_plans_list_all_saas_plans()
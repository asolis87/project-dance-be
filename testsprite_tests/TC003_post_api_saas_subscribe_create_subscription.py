import requests
from uuid import uuid4

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_saas_subscribe_create_subscription():
    try:
        # Step 1: Sign up a new user with a fresh random email
        random_email = f"test_{uuid4()}@example.com"
        signup_url = f"{BASE_URL}/api/auth/sign-up/email"
        signup_payload = {
            "email": random_email,
            "password": "securepassword123",
            "name": "Test User"
        }
        signup_headers = {
            "Origin": "http://localhost:3000",
            "Content-Type": "application/json"
        }

        signup_resp = requests.post(signup_url, json=signup_payload, headers=signup_headers, timeout=TIMEOUT)
        assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.status_code} {signup_resp.text}"
        # Extract set-cookie headers and form cookie string for subsequent requests
        set_cookie_headers = signup_resp.headers.get("set-cookie")
        assert set_cookie_headers is not None, "No set-cookie header received on signup"
        # The requests library merges multiple cookies into one cookie string in response headers,
        # but safer to use cookies from requests.Response.cookies:
        session_cookies = signup_resp.cookies.get_dict()
        cookie_header_value = "; ".join(f"{k}={v}" for k, v in session_cookies.items())

        # Step 2: Get list of saas plans to obtain a valid planId
        plans_url = f"{BASE_URL}/api/saas/plans"
        plans_resp = requests.get(plans_url, timeout=TIMEOUT)
        assert plans_resp.status_code == 200, f"Failed to get plans: {plans_resp.status_code} {plans_resp.text}"
        plans = plans_resp.json()
        assert isinstance(plans, list) and len(plans) > 0, "Plans list is empty or not a list"
        plan_id = plans[0].get("id") or plans[0].get("planId") or plans[0].get("stripePriceId") or plans[0].get("stripePlanId")
        # The PRD does not specify exact plan id property name, fallback to keys available
        if not plan_id:
            # Try common keys or fallback to first value
            if isinstance(plans[0], dict):
                plan_id = next(iter(plans[0].values()))
        assert plan_id, "No planId found in plans response"

        # Step 3: POST /api/saas/subscribe with valid Authorization and planId
        subscribe_url = f"{BASE_URL}/api/saas/subscribe"
        subscribe_payload = {
            "planId": plan_id
        }
        subscribe_headers = {
            "Origin": "http://localhost:3000",
            "Cookie": cookie_header_value,
        }
        # Authorization: Bearer token is mentioned. The PRD states login returns JWT or session cookie,
        # but we only did sign-up, no login endpoint is given explicitly with JWT.
        # So likely session cookie used for auth. If Authorization: Bearer is mandatory, need login, but not specified.
        # Since instructions demand cookie-based auth below sign-up, we'll proceed with Cookie header as auth.

        subscribe_resp = requests.post(subscribe_url, json=subscribe_payload, headers=subscribe_headers, timeout=TIMEOUT)
        assert subscribe_resp.status_code == 200, f"Subscription creation failed: {subscribe_resp.status_code} {subscribe_resp.text}"

        subscription_response = subscribe_resp.json()
        # Validate that SubscriptionResponse keys exist (generic check - no exact schema provided)
        # We expect at least some keys like subscriptionId, planId, status etc.
        assert isinstance(subscription_response, dict), "SubscriptionResponse is not a dict"
        assert "planId" in subscription_response or "subscriptionId" in subscription_response or "id" in subscription_response, \
            "SubscriptionResponse missing expected identifiers"

    except requests.RequestException as e:
        assert False, f"RequestException occurred: {e}"

test_post_api_saas_subscribe_create_subscription()
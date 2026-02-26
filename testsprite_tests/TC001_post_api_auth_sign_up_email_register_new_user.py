import requests
from uuid import uuid4

def test_post_api_auth_sign_up_email_register_new_user():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/auth/sign-up/email"
    random_email = f"test_{uuid4()}@example.com"
    payload = {
        "email": random_email,
        "password": "securepassword123",
        "name": "Test User"
    }
    headers = {
        "Origin": "http://localhost:3000",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        # Validate response status code 200 OK
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        response_json = response.json()
        # Validate that response contains expected user fields - minimally email and name
        assert response_json.get("email") is not None, "Response JSON missing or null 'email' field"
        assert response_json["email"] == random_email, "Response email does not match request email"
        assert response_json.get("name") is not None, "Response JSON missing or null 'name' field"
        assert response_json["name"] == "Test User", "Response name does not match request name"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_sign_up_email_register_new_user()

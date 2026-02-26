# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** project-dance-be
- **Date:** 2026-02-25
- **Prepared by:** TestSprite AI Team / Antigravity Agent

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication API
#### Test TC001 post api auth sign up email register new user
- **Test Error:** `AssertionError: Expected status code 200 but got 429`
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/a0be9477-9ee9-4c67-989f-07a61c0959bf)
- **Status:** ❌ Failed
- **Analysis / Findings:** Despite having instructions for generating unique accounts and CSRF origins, the tests still tripped the local Rate Limiting (429) mechanism. The test runner executed multiple scripts concurrently, causing the local IP to breach the 10 req/min limit instantly. 

### Requirement: SaaS Subscription API
#### Test TC002 get api saas plans list all saas plans
- **Test Error:** `AssertionError: Expected 200 OK, got 401`
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/a6bc6911-1e05-4526-9ea7-683de11309c7)
- **Status:** ❌ Failed
- **Analysis / Findings:** Public endpoint tested with authentication logic improperly wrapped around it, resulting in a 401 due to setup failures (429 Rate Limiting during setup).

#### Test TC003 post api saas subscribe create subscription
- **Test Error:** `AssertionError: Failed to get plans: 401 {"error":"No autorizado..."}`
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/f4d193aa-7daf-4aba-ae7f-600c901020f2)
- **Status:** ❌ Failed
- **Analysis / Findings:** Unauthorized because valid session cookies could not be extracted (likely due to the setup login failing via Rate Limiting).

### Requirement: Students API
#### Test TC004 get api academies academyid students list students for academy
- **Test Error:** `AssertionError: Login failed: `
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/60dccf41-535c-4249-8cc1-e9052094d393)
- **Status:** ❌ Failed
- **Analysis / Findings:** Login failed during test setup, preventing the actual endpoint from being reached.

#### Test TC005 post api academies academyid students create student for academy
- **Test Error:** `AssertionError: Create student failed: {"data":{"id":"f575108f-fbf0-498c-8eb8-4493bdc88b1e", ...}}`
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/2a83140e-b229-4367-a838-65e3bff56e36)
- **Status:** ❌ Failed
- **Analysis / Findings:** The student creation API call actually succeeded (created an entry in the database with a data object payload), but the test expected a specific raw JSON response structure that did not match the API's standard `data` wrapper envelope (which TestSprite wasn't parsing correctly). This means **the authentication and CSRF bypass finally worked** for this script, but the strict response body assertion failed.

### Requirement: Instructors API
#### Test TC006 get api academies academyid instructors list instructors for academy
- **Test Error:** `AssertionError: Signup failed: {"message":"Too many requests. Please try again later."}`
- **Test Visualization and Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/64592123-b7aa-40c6-a1b1-515787daa6bc/842644e3-1a6d-4993-be7f-b735342ee817)
- **Status:** ❌ Failed
- **Analysis / Findings:** Blocked by rate limiting during the setup signup phase.

---

## 3️⃣ Coverage & Matching Metrics

- **0.00%** of tests passed (0/6)

| Requirement | Total Tests | ✅ Passed | ❌ Failed |
| :--- | :---: | :---: | :---: |
| Authentication API | 1 | 0 | 1 |
| SaaS Subscription API | 2 | 0 | 2 |
| Students API | 2 | 0 | 2 |
| Instructors API | 1 | 0 | 1 |
| **Total** | **6** | **0** | **6** |

---

## 4️⃣ Key Gaps / Risks
1. **Parallel Execution & Rate Limiting (429):** The test runner sends authentication requests synchronously across its 6 test suites. This instantly triggers Better Auth's `10 hits / 60 seconds` rate limit, breaking the setup phase for almost all the tests. For TestSprite specifically, testing against isolated endpoints should be done sequentially, or Rate Limits must be fully disabled natively on the database/session store for the test environment.
2. **Response Wrapping Envelope:** Tests like TC005 successfully bypassed authentication, organization creation, and CSRF protection thanks to the new instructions, allowing the new database entity to be created. However, the test still failed because TestSprite explicitly expected a flatter response structure, whereas the Fastify application wraps its unified successes into a `{"data": {...}}` response envelope.
3. **Environment Segregation:** Running TestSprite against a local dev environment with concurrent load limits is unstable. The tests themselves are procedurally correct (handling authentication chains conceptually), but conflict physically due to network and rate-limit constraints. All scripts share the single `localhost` session pool natively.

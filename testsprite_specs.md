# TestSprite Specification Document
## Project: Project Dance (Backend)

### 1. Overview
Project Dance is a multi-tenant SaaS application (Backend) developed specifically for dance academy management. It allows academy owners to manage their instructors, students, classes (groups), attendance, and payments.

### 2. Tech Stack
- **Framework**: Fastify (Node.js) with TypeScript.
- **Database**: PostgreSQL with Kysely (Query Builder)
- **Authentication**: Better Auth (fastify-better-auth)
- **Validation**: Zod (via fastify-type-provider-zod)
- **Payments & Subscriptions**: Stripe
- **Emails**: Resend

### 3. Application Structure
The architecture is modular. Global routes cover authentication and SaaS logic, while business logic routes are scoped by `academyId`:

*   **Authentication** (`/auth/*` and `/api/auth/*`): Managed via Better Auth. Handles login, registration, and session management.
*   **SaaS & Subscriptions** (`/api/saas/*`): Handles SaaS subscription plans, billing (via Stripe Webhooks), and platform-wide features.
*   **Academy Scoped Modules** (`/api/academies/:academyId/*`):
    *   **Instructors** (`/instructors`): CRUD for academy instructors.
    *   **Students** (`/students`): CRUD for students enrolled in the academy.
    *   **Groups/Classes** (`/groups`): Class schedule management, assigning instructors and students.
    *   **Attendance** (`/attendance`): Tracking student attendance per group/class.
    *   **Payments** (`/payments`): Tracking academy-specific internal student payments (tuition, fees).
    *   **Reports** (`/reports`): Financial and attendance reports per academy.

### 4. Authentication Mechanism
Since "Better Auth" is used, routes are protected by session cookies or bearer tokens. A valid session is required to access scoped routes. Academy routes also validate that the authenticated user has access rights to the specific `:academyId`.

### 5. Error Handling
The application uses a standardized error handling mechanism (returning structured JSON with `error`, `message`, and `details`).
- Validation errors return `422 Unprocessable Entity` (ValidationError via Zod).
- Domain exceptions return custom statuses (AppError).
- Unauthorized/Forbidden return `401/403`.

### 6. Testing Scope for TestSprite
When generating test plans using TestSprite, focus on:
1.  **Authentication flows**: Validating active sessions.
2.  **Authorization**: Ensuring a user can only access data for academies they own or are part of.
3.  **CRUD Operations validation**: Making sure Zod validation schemas successfully block bad payloads.
4.  **Academy Isolation**: Data leakage between different `academyId` parameters must not occur.
5.  **Stripe Webhooks**: Ensure proper handling of SaaS subscription changes (optional if mocking is complex).

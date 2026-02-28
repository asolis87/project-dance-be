# AGENTS.md - Project Dance Backend

## Commands

### Development
- `pnpm dev` - Start development server with hot reload
- `pnpm db:up` / `pnpm db:down` - Start/stop Docker database

### Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- Single test: `pnpm vitest run src/modules/<module>/<module>.test.ts`

### Database
- `pnpm migrate` - Run better-auth migrations
- `pnpm migrate:custom` - Run custom migrations
- `pnpm migrate:all` - Run all migrations (better-auth + custom)

### Quality
- `tsc --noEmit` - Type check (strict mode enabled)

---

## Project Structure

```
src/
├── lib/                         # Core utilities
│   ├── db.ts                    # Kysely database instance
│   ├── auth.ts                  # Better-auth configuration
│   ├── email.ts                 # Email service (Resend)
│   ├── cron.ts                  # Cron job utilities
│   ├── config.ts                # Configuration (timeouts, retries)
│   ├── logger.ts                # Structured logging (Pino)
│   ├── health.ts                # Health check endpoint
│   ├── retry.ts                 # Retry utilities
│   ├── auth-middleware.ts       # Authentication middleware
│   └── academy-middleware.ts    # Academy isolation middleware
│
├── modules/                     # Feature modules
│   <module>/
│     ├── <module>.routes.ts     # Fastify route handlers
│     ├── <module>.service.ts    # Business logic (class-based)
│     ├── <module>.schema.ts     # Zod schemas (DTOs)
│     ├── <module>.test.ts       # Unit tests
│     ├── <module>.emails.ts     # Email templates (if needed)
│     └── index.ts               # Module exports
│
├── shared/
│   ├── database/
│   │   ├── types.ts             # Kysely table types
│   │   └── migrations/         # Database migrations
│   ├── helpers/
│   │   ├── errors.ts            # Custom error classes
│   │   ├── response.ts          # HTTP response helpers
│   │   └── audit.ts             # Audit logging
│   └── schemas/
│       └── pagination.schema.ts # Shared pagination schema
│
├── app.ts                       # Fastify app builder
└── server.ts                    # Entry point
```

---

## Code Style

### TypeScript
- **Strict mode** enabled in `tsconfig.json`
- Use explicit types for function parameters and return types when not obvious
- Prefer `interface` for object shapes, `type` for unions/aliases

### Naming Conventions
- **Files**: kebab-case (`students.service.ts`, `attendance.routes.ts`)
- **Classes/Types**: PascalCase (`StudentsService`, `CreateStudentDTO`)
- **Variables/Functions**: camelCase (`getById`, `academyId`)
- **Constants**: SCREAMING_SNAKE_CASE for config values

### Imports
- Use **relative paths** for internal modules (e.g., `../../lib/db`)
- Use **absolute paths** for node_modules (e.g., `import { z } from 'zod'`)
- Group imports in this order:
  1. External (fastify, zod, etc.)
  2. Internal lib (../../lib/*)
  3. Internal shared (../../shared/*)
  4. Internal module (./, ../)

### Zod Schemas
- Define in `<module>.schema.ts`
- Use `z.infer<typeof schema>` for TypeScript types
- Use Spanish error messages (e.g., `z.string().min(1, 'El nombre es requerido')`)

### Service Pattern
- Create a **class** for each service (e.g., `StudentsService`)
- Export both the class and an instance (e.g., `studentsService`)
- Use dependency injection via `db` singleton from `../../lib/db`

### Error Handling
Use custom error classes from `src/shared/helpers/errors.ts`:
- `NotFoundError(resource, id?)` - 404
- `ForbiddenError(message?)` - 403
- `ValidationError(message, details?)` - 422
- `ConflictError(message)` - 409
- `UnauthorizedError(message?)` - 401

### HTTP Responses
Use helpers from `src/shared/helpers/response.ts`:
- `success(reply, data, statusCode?)` - Single resource
- `paginated(reply, items, pagination)` - Paginated list
- `buildPagination(page, pageSize, total)` - Build pagination meta

### Routes
- Define routes in `<module>.routes.ts`
- Use `requireAcademy` middleware for academy-scoped endpoints
- Register routes under `/api/v1/<resource>` prefix
- Always define Zod schemas for params, query, and body

---

## Testing

### Structure
- Use `vitest` with `describe`/`it` blocks
- Place tests in `<module>.test.ts`
- Mock external dependencies with `vi.mock()`

### Database Mocking
```typescript
vi.mock('../../lib/db', () => {
  const mockChain = () => {
    const chain: Record<string, any> = {};
    // Mock all Kysely chain methods
    return chain;
  };
  return { db: mockChain() };
});
```

### Testing Guidelines
- Test one thing per `it` block
- Use descriptive test names in Spanish: "debe retornar...", "debe lanzar..."
- Always call `vi.clearAllMocks()` in `beforeEach`
- Use `expect().resolves` or `expect().rejects` for async assertions

---

## Database

### Kysely ORM
- Use Kysely's query builder pattern
- Always filter by `organization_id` for multi-tenant safety
- Use `.returningAll()` for inserts/updates
- Use `.executeTakeFirstOrThrow()` for single results

### Migrations
- Custom migrations in `src/shared/database/migrations/`
- Use descriptive names: `001_create_instructors.ts`
- Run migrations with `pnpm migrate:all`

---

## Auth & Security

### Better-Auth
- Auth configuration in `src/lib/auth.ts`
- Use `requireAcademy` middleware to ensure academy context
- Use `requireAuth` middleware to protect routes

### Multi-Tenancy
- Always filter queries by `organization_id` (academyId)
- Never trust client-provided academy ID - get from session/middleware

---

## Best Practices

1. **Async email**: Send emails fire-and-forget with `.catch()` for logging
2. **Logging**: Use `request.log` for request-scoped logging
3. **Soft deletes**: Prefer `is_active = false` over hard deletes
4. **Pagination**: Always paginate list endpoints
5. **Validation**: Validate all inputs with Zod schemas
6. **DTOs**: Define input/output types in schema files
7. **Timeouts**: Use config timeouts for external services (Stripe, Resend)
8. **Retry**: Use `withRetry()` for external service calls

---

## Production Features

### Health Check
- `GET /health` - Returns `{ status, timestamp, checks }`
- Verifies database connectivity

### Security
- **Helmet**: Security headers enabled
- **Rate Limiting**: 100 req/min (configurable via `RATE_LIMIT_MAX`)

### Graceful Shutdown
- Handles SIGTERM/SIGINT
- Closes DB connections cleanly

### Error Handling
- Uncaught exceptions logged and exit with code 1
- Global error handler with consistent error response format

### Structured Logging
- Production: JSON format via Pino
- Development: Pretty format
- Request/Response hooks with timing

### Audit Log
- Table `audit_log` for tracking sensitive actions
- Use `logAudit()` from `src/shared/helpers/audit.ts`

### External Services
- Stripe: Configurable timeout + retries
- Resend: Configurable timeout + retries
- See `src/lib/config.ts` for configuration

---

## Common Patterns

### Route Handler
```typescript
export async function studentsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      onRequest: [requireAcademy],
      schema: { params: academyParamsSchema, querystring: searchPaginationSchema },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { page, pageSize, search } = request.query;
      const { items, total } = await studentsService.list(academyId, page, pageSize, search);
      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );
}
```

### Service Method
```typescript
async getById(organizationId: string, id: string) {
  const student = await db
    .selectFrom('student')
    .where('id', '=', id)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  if (!student) {
    throw new NotFoundError('Alumno', id);
  }

  return student;
}
```

### Test
```typescript
describe('getById', () => {
  it('debe retornar el alumno cuando existe', async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(mockStudent);
    const result = await service.getById('org-1', 'stu-1');
    expect(result).toEqual(mockStudent);
  });

  it('debe lanzar NotFoundError cuando no existe', async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
    await expect(service.getById('org-1', 'no-existe')).rejects.toThrow('no encontrado');
  });
});
```

---
name: development-guide
description: Guía de desarrollo para el boilerplate Fastify con Better Auth. Cubre arquitectura modular por features, patrones de código, convenciones de nombres, creación de módulos, middleware de autenticación, migraciones y mejores prácticas. Usar cuando se desarrollen nuevas funcionalidades, se creen módulos, se agreguen rutas, se trabaje con autenticación o se necesite orientación sobre la estructura del proyecto.
---

# Guía de Desarrollo - Boilerplate Fastify

## Stack Tecnológico

| Tecnología | Propósito |
|---|---|
| **Fastify 5** | Framework web de alto rendimiento |
| **TypeScript 5** | Tipado estático |
| **Better Auth** | Autenticación completa (sesiones, email/password) |
| **better-sqlite3** | Base de datos embebida (gestionada por Better Auth) |
| **fastify-better-auth** | Plugin de integración Fastify ↔ Better Auth |
| **@fastify/cors** | Manejo de CORS |
| **tsx** | Ejecución directa de TypeScript en desarrollo |

## Arquitectura

Arquitectura **modular basada en features** con separación de responsabilidades:

```
Cliente → Fastify Server → Routes (validación, auth) → Services (lógica) → Database
```

### Capas

1. **Routes** (`*.routes.ts`) — Endpoints, validación de inputs, hooks de autenticación, respuestas HTTP
2. **Services** (`*.service.ts`) — Lógica de negocio, queries a BD, transformaciones
3. **Schemas** (`*.schema.ts`) — Definición de tipos y validación de datos
4. **Lib** (`src/lib/`) — Utilidades compartidas (auth, middleware)

## Estructura de Archivos

```
src/
├── server.ts                  # Punto de entrada (dotenv + listen)
├── app.ts                     # Construcción de la app (plugins + rutas)
├── lib/                       # Código compartido
│   ├── auth.ts                # Instancia de Better Auth
│   └── auth-middleware.ts     # Hook requireAuth
└── modules/                   # Módulos por feature
    └── [modulo]/
        ├── [modulo].routes.ts
        ├── [modulo].service.ts  # (si aplica)
        ├── [modulo].schema.ts   # (si aplica)
        └── index.ts             # Re-exportaciones
```

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case.ts` | `auth-middleware.ts` |
| Clases | `PascalCase` | `AuthService` |
| Variables/funciones | `camelCase` | `requireAuth` |
| Constantes | `UPPER_SNAKE_CASE` | `JWT_SECRET` |
| Módulos (carpetas) | `kebab-case` | `nuevo-modulo/` |
| Funciones de rutas | `[modulo]Routes` | `authRoutes` |

## Crear un Nuevo Módulo

### 1. Crear la estructura de archivos

```
src/modules/[nombre]/
├── [nombre].routes.ts
├── [nombre].service.ts   # si tiene lógica de negocio
├── [nombre].schema.ts    # si necesita validación
└── index.ts
```

### 2. Definir rutas

```typescript
// src/modules/items/items.routes.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../lib/auth-middleware';

export async function itemsRoutes(app: FastifyInstance) {
  // Ruta protegida
  app.get(
    '/',
    { onRequest: [requireAuth] },
    async (request) => {
      const { user } = (request as any).session;
      // ... lógica
      return { items: [] };
    },
  );

  // Ruta pública
  app.get('/public', async () => {
    return { message: 'Acceso libre' };
  });
}
```

### 3. Exportar desde index.ts

```typescript
// src/modules/items/index.ts
export { itemsRoutes } from './items.routes';
```

### 4. Registrar en app.ts

```typescript
// src/app.ts
import { itemsRoutes } from './modules/items';

// Dentro de buildApp():
app.register(itemsRoutes, { prefix: '/items' });
```

## Patrón de Autenticación

Better Auth maneja automáticamente las rutas de auth en `/api/auth/*`:
- `POST /api/auth/sign-up/email` — Registro
- `POST /api/auth/sign-in/email` — Login
- `POST /api/auth/sign-out` — Logout
- `GET /api/auth/get-session` — Obtener sesión

### Proteger rutas custom

Usar el hook `requireAuth` de `src/lib/auth-middleware.ts`:

```typescript
app.get(
  '/ruta-protegida',
  { onRequest: [requireAuth] },
  async (request) => {
    const { user, session } = (request as any).session;
    // user.id, user.email, user.name, etc.
  },
);
```

### Configurar Better Auth

La instancia se configura en `src/lib/auth.ts`. Opciones clave:

- `emailAndPassword` — Habilita auth por email/password
- `session` — Duración de sesiones y cache de cookies
- `rateLimit` — Protección contra fuerza bruta
- `trustedOrigins` — Orígenes CORS permitidos (vía `TRUSTED_ORIGINS` en .env)

## Variables de Entorno

Definidas en `.env` (ver `.env.example`):

| Variable | Requerida | Descripción |
|---|---|---|
| `BETTER_AUTH_SECRET` | Sí | Secreto para firma/encriptación (mín. 32 chars) |
| `BETTER_AUTH_URL` | Sí | URL base de la aplicación |
| `NODE_ENV` | No | Entorno (`development` por defecto) |
| `PORT` | No | Puerto del servidor (`3000` por defecto) |
| `TRUSTED_ORIGINS` | No | Orígenes CORS separados por coma |

## Registro de Plugins en app.ts

El orden importa en `buildApp()`:

1. **CORS** (`@fastify/cors`) — Siempre primero
2. **Better Auth** (`fastify-better-auth`) — Registra rutas automáticas de auth
3. **Módulos custom** — Rutas de la aplicación con su prefix

## Migraciones

Better Auth gestiona su propio schema de base de datos:

```bash
pnpm migrate    # Ejecuta: npx @better-auth/cli migrate
```

Esto crea/actualiza las tablas de `user`, `session`, `account`, y `verification` en `better-auth.db`.

## Comandos

```bash
pnpm dev        # Servidor en modo desarrollo (hot-reload con tsx watch)
pnpm migrate    # Ejecutar migraciones de Better Auth
```

## Convenciones de Git

Usar **Conventional Commits**:

```bash
feat: agregar endpoint para listar items
fix: corregir validación de email
docs: actualizar README con nuevos endpoints
refactor: extraer lógica de permisos a middleware
test: agregar tests para módulo de items
chore: actualizar dependencias
```

## Mejores Prácticas

### Seguridad
- Nunca subir `.env` a Git
- Usar secretos fuertes para `BETTER_AUTH_SECRET` (generar con `openssl rand -base64 32`)
- HTTPS en producción
- Actualizar dependencias regularmente

### Código
- Documentar funciones con JSDoc
- Un módulo por feature
- Mantener las rutas delegando lógica al service
- Tipar explícitamente parámetros de Fastify (`FastifyInstance`, `FastifyRequest`, `FastifyReply`)

### Base de Datos
- Las migraciones de Better Auth son automáticas; no modificar la BD manualmente
- Para tablas custom, considerar Kysely u otro query builder

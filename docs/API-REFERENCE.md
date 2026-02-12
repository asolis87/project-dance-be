# API Reference - Project Dance

Documentacion completa de la API backend para el equipo de frontend.

**Base URL:** `http://localhost:3000`

---

## Tabla de contenidos

- [Autenticacion](#1-autenticacion)
- [Academias (Organizaciones)](#2-academias-organizaciones)
- [Instructores](#3-instructores)
- [Alumnos](#4-alumnos)
- [Grupos / Clases](#5-grupos--clases)
- [Asistencia](#6-asistencia)
- [Membresias](#7-membresias)
- [Pagos](#8-pagos)
- [Reportes](#9-reportes)
- [Formato de respuestas](#formato-de-respuestas)
- [Codigos de error](#codigos-de-error)
- [Configuracion del cliente HTTP](#configuracion-del-cliente-http)

---

## Configuracion del cliente HTTP

### Autenticacion por cookies

La API usa **cookies httpOnly** para sesiones (no JWT). El frontend debe:

1. Enviar requests con `credentials: 'include'` (fetch) o `withCredentials: true` (axios).
2. Incluir el header `Origin` en todos los requests POST/PUT/DELETE (proteccion CSRF).
3. El dominio del frontend debe estar en `TRUSTED_ORIGINS` del backend.

```typescript
// Ejemplo con fetch
const response = await fetch('http://localhost:3000/api/auth/sign-in/email', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173',
  },
  body: JSON.stringify({ email, password }),
});
```

```typescript
// Ejemplo con axios
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});
```

---

## Formato de respuestas

### Recurso unico

```json
{
  "data": {
    "id": "uuid",
    "name": "Nombre",
    "..."
  }
}
```

### Lista paginada

```json
{
  "data": [
    { "id": "uuid", "name": "..." },
    { "id": "uuid", "name": "..." }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "error": "NOT_FOUND",
  "message": "Instructor con id \"abc\" no encontrado"
}
```

Con detalles de validacion:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Error de validacion en la solicitud",
  "details": [...]
}
```

---

## Codigos de error

| Codigo HTTP | Codigo error | Descripcion |
|-------------|-------------|-------------|
| 401 | `UNAUTHORIZED` | No hay sesion activa o expiro |
| 403 | `FORBIDDEN` | Sin permisos o no pertenece a la academia |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `CONFLICT` | Duplicado (ej: email ya registrado) |
| 422 | `VALIDATION_ERROR` | Datos invalidos en el request |
| 500 | `INTERNAL_SERVER_ERROR` | Error inesperado del servidor |

---

## 1. Autenticacion

Better Auth maneja las sesiones automaticamente via cookies.

### POST `/api/auth/sign-up/email`

Registrar nuevo usuario.

**Auth:** No requerida

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `name` | string | Si | - |
| `email` | string | Si | Formato email valido |
| `password` | string | Si | Min 8, max 128 caracteres |

```json
{
  "name": "Admin Academia",
  "email": "admin@danceacademy.com",
  "password": "password1234"
}
```

**Respuesta:** Sesion del usuario creado (cookie se establece automaticamente).

---

### POST `/api/auth/sign-in/email`

Iniciar sesion.

**Auth:** No requerida

**Body:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `email` | string | Si |
| `password` | string | Si |

```json
{
  "email": "admin@danceacademy.com",
  "password": "password1234"
}
```

**Respuesta:** Sesion del usuario (cookie se establece automaticamente).

---

### GET `/api/auth/get-session`

Verificar si hay sesion activa.

**Auth:** Cookie de sesion

**Respuesta exitosa:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Admin Academia",
    "email": "admin@danceacademy.com",
    "emailVerified": true,
    "image": null,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  },
  "session": {
    "id": "uuid",
    "expiresAt": "2026-01-22T10:00:00Z",
    "token": "..."
  }
}
```

**Sin sesion:** Retorna `null`.

---

### POST `/api/auth/sign-out`

Cerrar sesion.

**Auth:** Cookie de sesion

**Respuesta:** 200 OK. La cookie se invalida.

---

### GET `/auth/me`

Obtener informacion del usuario autenticado (ruta custom).

**Auth:** Requerida (cookie)

**Respuesta:**

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@danceacademy.com",
    "name": "Admin Academia",
    "image": null,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "session": {
    "id": "uuid",
    "expiresAt": "2026-01-22T10:00:00Z"
  }
}
```

---

### POST `/api/auth/change-password`

Cambiar contrasena (requiere sesion activa).

**Auth:** Requerida

**Body:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `currentPassword` | string | Si |
| `newPassword` | string | Si |
| `revokeOtherSessions` | boolean | No (default false) |

```json
{
  "currentPassword": "password1234",
  "newPassword": "newPassword5678",
  "revokeOtherSessions": true
}
```

---

### POST `/api/auth/forget-password`

Solicitar restablecimiento de contrasena. Envia un email con enlace de reset.

**Auth:** No requerida

**Body:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `email` | string | Si | Email del usuario |
| `redirectTo` | string | Si | URL del frontend donde aterriza el usuario |

```json
{
  "email": "admin@danceacademy.com",
  "redirectTo": "http://localhost:5173/reset-password"
}
```

> El enlace del email dirigira a `{redirectTo}?token=xxx`. El frontend debe extraer el `token` de la URL y enviarlo al siguiente endpoint.

---

### POST `/api/auth/reset-password`

Confirmar restablecimiento con el token recibido por email.

**Auth:** No requerida

**Body:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `token` | string | Si | Token del enlace de email |
| `newPassword` | string | Si | Nueva contrasena (min 8 chars) |

```json
{
  "token": "token-del-email",
  "newPassword": "nuevaPassword1234"
}
```

> El token expira en **1 hora**.

---

## 2. Academias (Organizaciones)

Cada academia es una "organizacion" de Better Auth. Un usuario debe crear o pertenecer a una academia antes de usar los modulos de negocio.

### POST `/api/auth/organization/create`

Crear una nueva academia.

**Auth:** Requerida

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `name` | string | Si | Nombre de la academia |
| `slug` | string | Si | Identificador URL-friendly, unico |

```json
{
  "name": "Salsa Mia Dance & Fitness",
  "slug": "salsa-mia-dance-fitness"
}
```

**Respuesta:** Objeto de la organizacion creada con su `id` (guardar este ID).

---

### GET `/api/auth/organization/list`

Listar las academias del usuario actual.

**Auth:** Requerida

**Respuesta:** Array de organizaciones.

---

### GET `/api/auth/organization/get-full?organizationId={id}`

Obtener detalle completo de una academia (incluye miembros).

**Auth:** Requerida

**Query:**

| Param | Tipo | Requerido |
|-------|------|-----------|
| `organizationId` | string | Si |

---

### POST `/api/auth/organization/set-active`

Establecer la academia activa para el usuario.

**Auth:** Requerida

**Body:**

```json
{
  "organizationId": "uuid-de-la-academia"
}
```

---

### POST `/api/auth/organization/invite-member`

Invitar a un usuario a la academia.

**Auth:** Requerida (owner o admin)

**Body:**

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| `organizationId` | string | Si | UUID de la academia |
| `email` | string | Si | Email del invitado |
| `role` | string | Si | `"owner"`, `"admin"`, `"member"` |

```json
{
  "organizationId": "uuid",
  "email": "instructor@danceacademy.com",
  "role": "admin"
}
```

---

## Flujo recomendado de onboarding

```
1. Usuario hace sign-up
2. Usuario hace sign-in
3. Verificar si tiene academias → GET /api/auth/organization/list
4. Si no tiene → Crear academia → POST /api/auth/organization/create
5. Guardar el academyId → Usarlo en todos los endpoints de negocio
```

---

## 3. Instructores

**Base:** `/api/academies/:academyId/instructors`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/instructors`

Listar instructores con paginacion y busqueda.

**Query params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina actual (min 1) |
| `pageSize` | number | 20 | Items por pagina (1-100) |
| `search` | string | - | Busca en nombre, email, especializacion |

**Respuesta:** Lista paginada de instructores.

```json
{
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "user_id": null,
      "name": "Carlos Perez",
      "email": "carlos@danceacademy.com",
      "phone": "5551234567",
      "specialization": "Salsa",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### POST `/api/academies/:academyId/instructors`

Crear instructor.

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `name` | string | Si | Min 1, max 200 |
| `email` | string | Si | Formato email valido |
| `phone` | string | No | Max 20 |
| `specialization` | string | No | Max 200 |

```json
{
  "name": "Carlos Perez",
  "email": "carlos@danceacademy.com",
  "phone": "5551234567",
  "specialization": "Salsa"
}
```

**Respuesta:** `{ "data": instructor }` con status 201.

---

### GET `/api/academies/:academyId/instructors/:id`

Obtener instructor por ID.

**Respuesta:** `{ "data": instructor }`

---

### PUT `/api/academies/:academyId/instructors/:id`

Actualizar instructor. Todos los campos son opcionales.

**Body:**

| Campo | Tipo | Validacion |
|-------|------|------------|
| `name` | string | Min 1, max 200 |
| `email` | string | Formato email |
| `phone` | string \| null | Max 20 |
| `specialization` | string \| null | Max 200 |
| `is_active` | boolean | - |

**Respuesta:** `{ "data": instructor_actualizado }`

---

### DELETE `/api/academies/:academyId/instructors/:id`

Eliminar instructor. Falla si tiene grupos activos asignados.

**Respuesta:** 204 No Content.

---

### GET `/api/academies/:academyId/instructors/:id/groups`

Historial de grupos que imparte/impartio el instructor.

**Respuesta:** `{ "data": [grupos] }`

---

## 4. Alumnos

**Base:** `/api/academies/:academyId/students`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/students`

Listar alumnos con paginacion y busqueda.

**Query params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina actual |
| `pageSize` | number | 20 | Items por pagina (1-100) |
| `search` | string | - | Busca en nombre, email, numero de afiliacion |

**Respuesta:** Lista paginada.

```json
{
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "name": "Ana Lopez",
      "email": "ana@email.com",
      "phone": "5559876543",
      "affiliation_number": "ALU-00001",
      "qr_code": null,
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 12, "totalPages": 1 }
}
```

---

### POST `/api/academies/:academyId/students`

Crear alumno. El `affiliation_number` se genera automaticamente.

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `name` | string | Si | Min 1, max 200 |
| `email` | string | Si | Formato email |
| `phone` | string | No | Max 20 |

```json
{
  "name": "Ana Lopez",
  "email": "ana@email.com",
  "phone": "5559876543"
}
```

**Respuesta:** `{ "data": alumno }` con status 201.

---

### GET `/api/academies/:academyId/students/:id`

Obtener alumno por ID.

---

### PUT `/api/academies/:academyId/students/:id`

Actualizar alumno.

**Body:**

| Campo | Tipo | Validacion |
|-------|------|------------|
| `name` | string | Min 1, max 200 |
| `email` | string | Formato email |
| `phone` | string \| null | Max 20 |
| `is_active` | boolean | - |

---

### DELETE `/api/academies/:academyId/students/:id`

Eliminar alumno.

**Respuesta:** 204 No Content.

---

### GET `/api/academies/:academyId/students/:id/groups`

Historial de grupos en los que esta/estuvo inscrito.

**Respuesta:**

```json
{
  "data": [
    {
      "group_id": "uuid",
      "group_name": "Salsa Avanzado",
      "schedule": "Lun/Mie 18:00-19:30",
      "group_active": true,
      "enrolled_at": "2026-01-10T10:00:00Z",
      "unenrolled_at": null,
      "enrollment_active": true
    }
  ]
}
```

---

### GET `/api/academies/:academyId/students/:id/payments`

Historial de pagos del alumno.

**Respuesta:** `{ "data": [pagos] }`

---

### GET `/api/academies/:academyId/students/:id/qr`

Generar/obtener codigo QR del alumno. El QR codifica su numero de afiliacion.

**Respuesta:**

```json
{
  "data": {
    "qr_code": "data:image/png;base64,...",
    "affiliation_number": "ALU-00001"
  }
}
```

---

## 5. Grupos / Clases

**Base:** `/api/academies/:academyId/groups`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/groups`

Listar grupos con paginacion y busqueda.

**Query params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina actual |
| `pageSize` | number | 20 | Items por pagina (1-100) |
| `search` | string | - | Busca en nombre del grupo |

---

### POST `/api/academies/:academyId/groups`

Crear grupo.

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `name` | string | Si | Min 1, max 200 |
| `instructor_id` | string | Si | UUID valido de un instructor existente |
| `description` | string | No | Max 500 |
| `schedule` | string | No | Max 200 (ej: "Lun/Mie 18:00-19:30") |
| `capacity` | number | Si | Entero, min 1 |

```json
{
  "name": "Salsa Avanzado",
  "instructor_id": "uuid-del-instructor",
  "description": "Clase de salsa nivel avanzado",
  "schedule": "Lun/Mie 18:00-19:30",
  "capacity": 25
}
```

**Respuesta:** `{ "data": grupo }` con status 201.

---

### GET `/api/academies/:academyId/groups/:id`

Detalle del grupo incluyendo alumnos inscritos.

---

### PUT `/api/academies/:academyId/groups/:id`

Actualizar grupo.

**Body:**

| Campo | Tipo | Validacion |
|-------|------|------------|
| `name` | string | Min 1, max 200 |
| `instructor_id` | string | UUID |
| `description` | string \| null | Max 500 |
| `schedule` | string \| null | Max 200 |
| `capacity` | number | Entero, min 1 |
| `is_active` | boolean | - |

---

### DELETE `/api/academies/:academyId/groups/:id`

Eliminar grupo.

**Respuesta:** 204 No Content.

---

### POST `/api/academies/:academyId/groups/:id/enroll`

Inscribir alumno al grupo.

**Body:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `student_id` | string | Si (UUID) |

```json
{
  "student_id": "uuid-del-alumno"
}
```

**Respuesta:** `{ "data": enrollment }` con status 201.

---

### DELETE `/api/academies/:academyId/groups/:id/enroll/:studentId`

Desinscribir alumno del grupo.

**Respuesta:** 204 No Content.

---

## 6. Asistencia

**Base:** `/api/academies/:academyId/attendance`

**Auth:** Requiere sesion + pertenecer a la academia.

### POST `/api/academies/:academyId/attendance/qr`

Registrar asistencia por codigo QR.

**Body:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `qr_data` | string | Si | Contenido del QR escaneado |
| `group_id` | string | Si | UUID del grupo |

```json
{
  "qr_data": "{\"affiliationNumber\":\"ALU-00001\",\"studentId\":\"uuid\",\"organizationId\":\"uuid\"}",
  "group_id": "uuid-del-grupo"
}
```

---

### POST `/api/academies/:academyId/attendance/number`

Registrar asistencia por numero de afiliacion.

**Body:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `affiliation_number` | string | Si |
| `group_id` | string | Si (UUID) |

```json
{
  "affiliation_number": "ALU-00001",
  "group_id": "uuid-del-grupo"
}
```

---

### POST `/api/academies/:academyId/attendance/manual`

Registrar asistencia manual (seleccionando alumno).

**Body:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `student_id` | string | Si (UUID) |
| `group_id` | string | Si (UUID) |

```json
{
  "student_id": "uuid-del-alumno",
  "group_id": "uuid-del-grupo"
}
```

---

### GET `/api/academies/:academyId/attendance/groups/:id`

Historial de asistencia de un grupo.

**Query params:**

| Param | Tipo | Requerido | Formato |
|-------|------|-----------|---------|
| `from` | string | No | `YYYY-MM-DD` |
| `to` | string | No | `YYYY-MM-DD` |

**Respuesta:** `{ "data": [registros_de_asistencia] }`

---

## 7. Membresias

**Base:** `/api/academies/:academyId/memberships`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/memberships`

Listar membresias con filtro por estado.

**Query params:**

| Param | Tipo | Default | Valores |
|-------|------|---------|---------|
| `status` | string | - | `active`, `expired`, `cancelled`, `expiring_soon` |
| `page` | number | 1 | Min 1 |
| `pageSize` | number | 20 | 1-100 |

> `expiring_soon` = membresias activas que vencen en los proximos 7 dias.

**Respuesta:**

```json
{
  "data": [
    {
      "id": "uuid",
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-02-01T00:00:00Z",
      "amount": "500.00",
      "status": "active",
      "created_at": "2026-01-01T10:00:00Z",
      "student_id": "uuid",
      "student_name": "Ana Lopez",
      "student_email": "ana@email.com",
      "affiliation_number": "ALU-00001"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 8, "totalPages": 1 }
}
```

---

### POST `/api/academies/:academyId/memberships`

Crear membresia para un alumno.

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `student_id` | string | Si | UUID de alumno existente |
| `start_date` | string | Si | Formato `YYYY-MM-DD` |
| `end_date` | string | Si | Formato `YYYY-MM-DD`, debe ser posterior a start_date |
| `amount` | string | Si | Decimal como string (ej: `"500.00"`) |

```json
{
  "student_id": "uuid-del-alumno",
  "start_date": "2026-02-01",
  "end_date": "2026-03-01",
  "amount": "500.00"
}
```

**Respuesta:** `{ "data": membresia }` con status 201.

---

## 8. Pagos

**Base:** `/api/academies/:academyId/payments`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/payments`

Listar pagos con filtro por rango de fechas.

**Query params:**

| Param | Tipo | Default | Formato |
|-------|------|---------|---------|
| `from` | string | - | `YYYY-MM-DD` |
| `to` | string | - | `YYYY-MM-DD` |
| `page` | number | 1 | Min 1 |
| `pageSize` | number | 20 | 1-100 |

**Respuesta:**

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": "500.00",
      "paid_at": "2026-02-01T15:30:00Z",
      "type": "full",
      "notes": null,
      "created_at": "2026-02-01T15:30:00Z",
      "membership_id": "uuid",
      "student_id": "uuid",
      "student_name": "Ana Lopez",
      "student_email": "ana@email.com"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 }
}
```

---

### POST `/api/academies/:academyId/payments`

Registrar un pago.

**Body:**

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| `membership_id` | string | Si | UUID de membresia existente |
| `student_id` | string | Si | UUID de alumno existente |
| `amount` | string | Si | Decimal como string (ej: `"500.00"`) |
| `type` | string | Si | `"full"` o `"partial"` |
| `notes` | string | No | Max 500 caracteres |

```json
{
  "membership_id": "uuid-de-membresia",
  "student_id": "uuid-del-alumno",
  "amount": "500.00",
  "type": "full",
  "notes": "Pago en efectivo"
}
```

> **Comportamiento al registrar pago `"full"`:**
>
> - **Membresía vigente** (`end_date >= hoy`): extiende `end_date` sumando el período original de la membresía (diferencia entre `start_date` y `end_date`).
> - **Membresía expirada** (`end_date < hoy`): reinicia desde hoy (`start_date = hoy`, `end_date = hoy + período`) y cambia `status` a `"active"`.
> - **Pagos parciales** (`"partial"`): no modifican las fechas ni el estado de la membresía.

**Respuesta:** `{ "data": { ...pago, membership } }` con status 201.

La respuesta incluye un objeto `membership` con:

| Campo | Descripcion |
|-------|-------------|
| `id` | UUID de la membresía |
| `start_date` | Fecha de inicio (actualizada si aplica) |
| `end_date` | Nueva fecha de fin |
| `status` | Estado actual |
| `previous_end_date` | Fecha de fin anterior (para mostrar la extensión) |

---

## 9. Reportes

**Base:** `/api/academies/:academyId/reports`

**Auth:** Requiere sesion + pertenecer a la academia.

### GET `/api/academies/:academyId/reports/dashboard`

KPIs principales de la academia.

**Respuesta:**

```json
{
  "data": {
    "students": {
      "total_active": 45
    },
    "instructors": {
      "total_active": 8
    },
    "groups": {
      "total_active": 12
    },
    "revenue": {
      "monthly": "15000.00"
    },
    "memberships": {
      "expiring_soon": 5,
      "expired": 3
    },
    "attendance": {
      "monthly_total": 320
    }
  }
}
```

| Campo | Descripcion |
|-------|-------------|
| `students.total_active` | Total de alumnos activos |
| `instructors.total_active` | Total de instructores activos |
| `groups.total_active` | Total de grupos activos |
| `revenue.monthly` | Ingresos del mes actual (string decimal) |
| `memberships.expiring_soon` | Membresias que vencen en 7 dias |
| `memberships.expired` | Membresias ya vencidas |
| `attendance.monthly_total` | Asistencias registradas este mes |

---

### GET `/api/academies/:academyId/reports/attendance`

Reporte detallado de asistencia.

**Query params:**

| Param | Tipo | Requerido | Formato |
|-------|------|-----------|---------|
| `from` | string | No | `YYYY-MM-DD` |
| `to` | string | No | `YYYY-MM-DD` |
| `group_id` | string | No | UUID del grupo |

**Respuesta:**

```json
{
  "data": {
    "by_student": [
      {
        "student_id": "uuid",
        "student_name": "Ana Lopez",
        "total_attendance": 18
      }
    ],
    "by_date": [
      {
        "date": "2026-02-10",
        "total": 12
      }
    ]
  }
}
```

| Campo | Descripcion |
|-------|-------------|
| `by_student` | Asistencia por alumno (orden: mayor a menor) |
| `by_date` | Asistencia por fecha (orden: mas reciente primero) |

---

### GET `/api/academies/:academyId/reports/revenue`

Reporte de ingresos.

**Query params:**

| Param | Tipo | Requerido | Formato |
|-------|------|-----------|---------|
| `from` | string | No | `YYYY-MM-DD` |
| `to` | string | No | `YYYY-MM-DD` |

**Respuesta:**

```json
{
  "data": {
    "total": "45000.00",
    "by_month": [
      {
        "month": "2026-02",
        "total": "15000.00",
        "payment_count": 30
      },
      {
        "month": "2026-01",
        "total": "30000.00",
        "payment_count": 55
      }
    ],
    "by_type": [
      {
        "type": "full",
        "total": "40000.00",
        "count": 70
      },
      {
        "type": "partial",
        "total": "5000.00",
        "count": 15
      }
    ]
  }
}
```

| Campo | Descripcion |
|-------|-------------|
| `total` | Suma total de ingresos (string decimal) |
| `by_month` | Desglose por mes (mas reciente primero) |
| `by_type` | Desglose por tipo de pago (`full` / `partial`) |

---

## Pantallas sugeridas para el frontend

Basado en los requerimientos del proyecto:

1. **Login / Registro / Forgot Password**
2. **Dashboard** - KPIs del reporte `/reports/dashboard`
3. **Instructores** - Tabla paginada con CRUD + historial de grupos
4. **Alumnos** - Tabla paginada con CRUD + pestanas: grupos, pagos, QR
5. **Grupos** - Tabla paginada con CRUD + detalle con alumnos inscritos + inscribir/desinscribir
6. **Asistencia** - Registrar por QR/numero/manual + historial por grupo
7. **Pagos** - Membresias (con filtro por status) + registro de pagos
8. **Reportes** - Graficas con datos de asistencia e ingresos

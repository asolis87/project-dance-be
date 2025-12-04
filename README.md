# 🚀 Academy Fastify - API de Autenticación

API REST moderna construida con Fastify, TypeScript y SQLite, implementando autenticación JWT con Refresh Tokens.

---

## 📚 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Comandos Disponibles](#-comandos-disponibles)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Flujo de Autenticación](#-flujo-de-autenticación)
- [Desarrollo de Nuevas Funcionalidades](#-desarrollo-de-nuevas-funcionalidades)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)
- [Testing](#-testing)
- [Mejores Prácticas](#-mejores-prácticas)

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **[Fastify](https://www.fastify.io/)** | 5.x | Framework web de alto rendimiento |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.x | Tipado estático y mejor DX |
| **[Kysely](https://kysely.dev/)** | 0.28.x | Query builder type-safe para SQL |
| **[SQLite](https://www.sqlite.org/)** | 3.x | Base de datos ligera y embebida |
| **[Zod](https://zod.dev/)** | 4.x | Validación de schemas |
| **[JWT](https://jwt.io/)** | - | Autenticación basada en tokens |
| **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** | 3.x | Hash de contraseñas |

---

## ✨ Características

- ✅ **Autenticación JWT** con Access Tokens (15 min) y Refresh Tokens (7 días)
- ✅ **Type-safe Database** con Kysely y TypeScript
- ✅ **Validación automática** con Zod y fastify-type-provider-zod
- ✅ **Sistema de migraciones** para control de versiones de la BD
- ✅ **Refresh Token Rotation** para mayor seguridad
- ✅ **Cookies HttpOnly** para almacenar Refresh Tokens
- ✅ **Hash de contraseñas** con bcrypt
- ✅ **Arquitectura modular** escalable

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.x
- **pnpm** >= 8.x (recomendado) o npm
- **Git**

```bash
# Verificar versiones
node --version
pnpm --version
git --version
```

---

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd academy-fastify
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Contenido del `.env`:

```env
# JWT Secret (cambiar en producción)
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion

# Node Environment
NODE_ENV=development

# Server
PORT=3000
```

### 4. Ejecutar migraciones

```bash
pnpm migrate
```

Esto creará las tablas necesarias en la base de datos SQLite.

### 5. Iniciar el servidor

```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | (requerido) |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |

---

## 🏗️ Arquitectura

Este proyecto sigue una **arquitectura modular basada en features** con separación de responsabilidades:

```
┌─────────────────────────────────────────────────┐
│                   Cliente                       │
│            (Postman, Frontend, etc)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                Fastify Server                   │
│  ┌───────────────────────────────────────────┐  │
│  │         Routes (auth.routes.ts)           │  │
│  │  • Validación (Zod)                       │  │
│  │  • Autenticación (JWT)                    │  │
│  │  • Autorización (Middleware)              │  │
│  └───────────────┬───────────────────────────┘  │
│                  │                               │
│  ┌───────────────▼───────────────────────────┐  │
│  │       Service (auth.service.ts)           │  │
│  │  • Lógica de negocio                      │  │
│  │  • Validaciones complejas                 │  │
│  │  • Transformaciones                       │  │
│  └───────────────┬───────────────────────────┘  │
│                  │                               │
│  ┌───────────────▼───────────────────────────┐  │
│  │        Database (Kysely + SQLite)         │  │
│  │  • Queries type-safe                      │  │
│  │  • Migraciones                            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Capas de Responsabilidad

1. **Routes** (`*.routes.ts`)
   - Definición de endpoints
   - Validación de inputs (Zod schemas)
   - Autenticación y autorización
   - Manejo de respuestas HTTP

2. **Services** (`*.service.ts`)
   - Lógica de negocio
   - Interacción con la base de datos
   - Transformación de datos
   - Validaciones complejas

3. **Schemas** (`*.schema.ts`)
   - Definición de tipos con Zod
   - Validación de datos
   - Inferencia de tipos TypeScript

4. **Database** (`shared/database/`)
   - Configuración de Kysely
   - Definición de tipos de tablas
   - Migraciones

---

## 📁 Estructura del Proyecto

```
academy-fastify/
├── src/
│   ├── modules/                    # Módulos de la aplicación
│   │   └── auth/                   # Módulo de autenticación
│   │       ├── auth.routes.ts      # Rutas del módulo
│   │       ├── auth.service.ts     # Lógica de negocio
│   │       ├── auth.schema.ts      # Schemas de validación
│   │       └── index.ts            # Exportaciones
│   │
│   ├── shared/                     # Código compartido
│   │   ├── database/               # Configuración de BD
│   │   │   ├── migrations/         # Migraciones SQL
│   │   │   │   ├── 001_create_auth_table.ts
│   │   │   │   └── 002_create_refresh_token.ts
│   │   │   ├── db.ts              # Instancia de Kysely
│   │   │   └── types.ts           # Tipos de tablas
│   │   │
│   │   └── plugins/               # Plugins de Fastify
│   │       ├── jwt.ts             # Configuración JWT
│   │       └── cookie.ts          # Configuración cookies
│   │
│   ├── types/                     # Tipos TypeScript globales
│   │   └── fastify.d.ts           # Extensiones de Fastify
│   │
│   ├── migrate.ts                 # Script de migraciones
│   └── server.ts                  # Punto de entrada
│
├── .env                           # Variables de entorno (no en Git)
├── .gitignore                     # Archivos ignorados
├── api.http                       # Tests con REST Client
├── package.json                   # Dependencias
├── pnpm-lock.yaml                 # Lock de dependencias
├── tsconfig.json                  # Config de TypeScript
└── README.md                      # Este archivo
```

---

## 🎮 Comandos Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia el servidor en modo desarrollo con hot-reload

# Migraciones
pnpm migrate          # Ejecuta migraciones pendientes

# Build (si se implementa)
pnpm build           # Compila TypeScript a JavaScript
pnpm start           # Inicia el servidor en producción
```

---

## 🔌 Endpoints de la API

### Base URL: `http://localhost:3000`

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/auth/register` | No | Registrar nuevo usuario |
| `POST` | `/auth/login` | No | Iniciar sesión |
| `GET` | `/auth/me` | Sí (JWT) | Obtener usuario autenticado |
| `POST` | `/auth/refresh` | Sí (Cookie) | Refrescar access token |
| `POST` | `/auth/logout` | Sí (Cookie) | Cerrar sesión |

### Ejemplos de Uso

#### 1. Registrar Usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta 201:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid-aqui",
    "email": "usuario@example.com",
    "created_at": "2025-12-04T18:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Obtener Usuario Autenticado

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta 200:**
```json
{
  "id": "uuid-aqui",
  "email": "usuario@example.com",
  "iat": 1733342000,
  "exp": 1733342900
}
```

#### 4. Refrescar Token

```http
POST /auth/refresh
```

**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 5. Logout

```http
POST /auth/logout
```

**Respuesta 200:**
```json
{
  "message": "Sesión cerrada"
}
```

---

## 🔐 Flujo de Autenticación

### Diagrama de Flujo

```
1. REGISTRO/LOGIN
   ↓
   Genera Access Token (JWT) - 15 minutos
   Genera Refresh Token (UUID) - 7 días
   ↓
   Guarda Refresh Token en cookie HttpOnly
   ↓
   Retorna Access Token al cliente

2. ACCESO A RECURSOS PROTEGIDOS
   ↓
   Cliente envía Access Token en header
   ↓
   Middleware verifica y decodifica token
   ↓
   Si es válido: Acceso permitido
   Si expiró: Error 401

3. RENOVAR TOKEN
   ↓
   Cliente envía cookie con Refresh Token
   ↓
   Servidor valida Refresh Token en BD
   ↓
   Si es válido:
     - Invalida Refresh Token antiguo
     - Genera nuevo Refresh Token
     - Genera nuevo Access Token
     - Retorna nuevo Access Token
   Si es inválido: Error 401

4. LOGOUT
   ↓
   Invalida Refresh Token en BD
   ↓
   Elimina cookie
```

### Tokens

| Token | Tipo | Duración | Almacenamiento | Uso |
|-------|------|----------|----------------|-----|
| **Access Token** | JWT | 15 minutos | Cliente (memoria/localStorage) | Autenticación en cada request |
| **Refresh Token** | UUID | 7 días | Cookie HttpOnly | Renovar Access Token |

---

## 🚀 Desarrollo de Nuevas Funcionalidades

### Paso 1: Crear un nuevo módulo

```bash
mkdir -p src/modules/nuevo-modulo
cd src/modules/nuevo-modulo
```

### Paso 2: Crear archivos del módulo

```
src/modules/nuevo-modulo/
├── nuevo-modulo.routes.ts    # Rutas
├── nuevo-modulo.service.ts   # Lógica de negocio
├── nuevo-modulo.schema.ts    # Validaciones
└── index.ts                  # Exportaciones
```

### Paso 3: Definir schemas (Zod)

**`nuevo-modulo.schema.ts`**

```typescript
import { z } from 'zod';

// Schema de entrada
export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Inferir tipos TypeScript
export type CreateItemDTO = z.infer<typeof createItemSchema>;
```

### Paso 4: Crear el servicio

**`nuevo-modulo.service.ts`**

```typescript
import { db } from '../../shared/database/db';
import { CreateItemDTO } from './nuevo-modulo.schema';

export class NuevoModuloService {
  
  /**
   * Crear un nuevo item
   * @param data - Datos del item
   * @returns Item creado
   */
  async createItem(data: CreateItemDTO) {
    const result = await db
      .insertInto('items')
      .values({
        name: data.name,
        description: data.description,
      })
      .returning(['id', 'name', 'created_at'])
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Listar todos los items
   * @returns Lista de items
   */
  async listItems() {
    const items = await db
      .selectFrom('items')
      .selectAll()
      .execute();

    return items;
  }
}

export const nuevoModuloService = new NuevoModuloService();
```

### Paso 5: Definir rutas

**`nuevo-modulo.routes.ts`**

```typescript
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createItemSchema } from './nuevo-modulo.schema';
import { nuevoModuloService } from './nuevo-modulo.service';

export async function nuevoModuloRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // POST /items - Crear item (protegido)
  server.post(
    '/items',
    {
      onRequest: [app.authenticate], // Requiere autenticación
      schema: {
        body: createItemSchema,
      },
    },
    async (request, reply) => {
      const item = await nuevoModuloService.createItem(request.body);
      return reply.status(201).send(item);
    }
  );

  // GET /items - Listar items (público)
  server.get('/items', async (request, reply) => {
    const items = await nuevoModuloService.listItems();
    return reply.send(items);
  });
}
```

### Paso 6: Registrar el módulo

**`src/server.ts`**

```typescript
import { nuevoModuloRoutes } from './modules/nuevo-modulo';

// ... código existente ...

// Registrar módulo
app.register(nuevoModuloRoutes, { prefix: '/api' });
```

---

## 🗄️ Migraciones de Base de Datos

### Crear una nueva migración

1. **Crear el archivo de migración:**

```bash
touch src/shared/database/migrations/003_create_items_table.ts
```

2. **Definir la migración:**

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('items')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => 
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('items').execute();
}
```

3. **Actualizar tipos de la base de datos:**

**`src/shared/database/types.ts`**

```typescript
export interface ItemsTable {
  id: string;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
}

export interface Database {
  auth: AuthTable;
  refresh_token: RefreshTokenTable;
  items: ItemsTable; // ← Nuevo
}
```

4. **Ejecutar la migración:**

```bash
pnpm migrate
```

---

## 🧪 Testing

### Usando REST Client (VS Code)

El archivo `api.http` contiene ejemplos de todos los endpoints:

```http
### 1. Registrar usuario
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Usando Postman

Importa los comandos cURL del README en Postman:
1. En Postman, click en **"Import"**
2. Pega un comando cURL
3. Click en **"Continue"** > **"Import"**

### Testing Manual

```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 💡 Mejores Prácticas

### 1. Seguridad

- ✅ **Nunca** subas el archivo `.env` a Git
- ✅ Usa contraseñas fuertes para `JWT_SECRET`
- ✅ En producción, usa HTTPS siempre
- ✅ Actualiza dependencias regularmente

### 2. Código

- ✅ Usa JSDoc para documentar funciones
- ✅ Sigue la convención de nombres:
  - Archivos: `kebab-case.ts`
  - Clases: `PascalCase`
  - Variables/funciones: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`

### 3. Base de Datos

- ✅ **NUNCA** modifiques migraciones ya ejecutadas
- ✅ Crea una nueva migración para cada cambio
- ✅ Haz backup antes de ejecutar migraciones en producción

### 4. Git

```bash
# Commits descriptivos
git commit -m "feat: agregar endpoint para listar items"
git commit -m "fix: corregir validación de email"
git commit -m "docs: actualizar README con nuevos endpoints"
```

Prefijos comunes:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de mantenimiento

---

## 📖 Recursos Adicionales

- [Fastify Documentation](https://www.fastify.io/)
- [Kysely Documentation](https://kysely.dev/)
- [Zod Documentation](https://zod.dev/)
- [JWT Best Practices](https://jwt.io/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

ISC

---

## 👤 Autor

Alvaro Emmanuel Solis Aranda

---

## 🎯 Roadmap

- [ ] Implementar tests unitarios y de integración
- [ ] Agregar rate limiting
- [ ] Implementar paginación
- [ ] Agregar logger estructurado (Pino)
- [ ] Implementar manejo de errores centralizado
- [ ] Agregar validación de emails con verificación
- [ ] Implementar recuperación de contraseña
- [ ] Agregar roles y permisos
- [ ] Documentación con Swagger/OpenAPI
- [ ] CI/CD con GitHub Actions
- [ ] Dockerizar la aplicación

---

¿Preguntas? ¿Problemas? Abre un issue en el repositorio. 🚀

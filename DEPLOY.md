# Deploy con Dokploy

## Pre-requisitos

- Dokploy instalado en VPS
- Dominio configurado apuntando al VPS
- PostgreSQL disponible en Dokploy

---

## Configuración de Servicios en Dokploy

### 1. Crear Proyecto

En el panel de Dokploy:
- **Project Name**: `project-dance`

### 2. Crear Servicio de Base de Datos

Crear dos bases de datos PostgreSQL:

| Servicio | Nombre DB | Usuario |
|----------|-----------|---------|
| production | `project_dance_prod` | default |
| staging | `project_dance_staging` | default |

### 3. Crear Servicio de Aplicación

Crear dos servicios (Production y Staging):

| Config | Valor |
|--------|-------|
| **Service Name** | `production` / `staging` |
| **Service Type** | Application |
| **Build Pack** | Dockerfile |
| **Dockerfile Path** | `/Dockerfile` |
| **Port** | `3000` |
| **Instance** | 1 |

---

## Variables de Entorno

### Production

```
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=<generar-con: openssl rand -base64 32>
BETTER_AUTH_URL=https://api.tudominio.com
DATABASE_URL=postgresql://user:pass@postgres:5432/project_dance_prod
TRUSTED_ORIGINS=https://tudominio.com,https://www.tudominio.com
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=Dance Academy <noreply@tudominio.com>
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=https://tudominio.com/subscription/success
STRIPE_CANCEL_URL=https://tudominio.com/subscription/cancel
```

### Staging

```
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=<diferente-al-de-prod>
BETTER_AUTH_URL=https://staging.tudominio.com
DATABASE_URL=postgresql://user:pass@postgres:5432/project_dance_staging
TRUSTED_ORIGINS=https://staging.tudominio.com
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=Dance Staging <staging@tudominio.com>
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=https://staging.tudominio.com/subscription/success
STRIPE_CANCEL_URL=https://staging.tudominio.com/subscription/cancel
```

---

## Post-Deploy

### 1. Ejecutar Migraciones

Una vez levantados los contenedores, acceder al terminal de cada servicio y ejecutar:

```bash
pnpm migrate:all
```

### 2. Verificar Health Check

```
GET https://api.tudominio.com/health
GET https://staging.tudominio.com/health
```

---

## URLs Esperadas

| Ambiente | URL |
|----------|-----|
| Production | `https://api.tudominio.com` |
| Staging | `https://staging.tudominio.com` |

---

## Recursos

- **RAM estimada**: 1.5-2 GB total
- **Disco estimado**: 15-20 GB

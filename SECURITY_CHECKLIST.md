# Security Checklist - Project Dance Backend

## Pre-Production Review

### Autenticación y Autorización
- [x] Better-Auth configurado con métodos seguros
- [ ] MFA habilitado para cuentas de admin
- [ ] Tokens de sesión con expiración adecuada
- [ ] Rate limiting en endpoints de auth (10 req/min)
- [ ] Contraseñas con requisitos mínimos (8+ chars, números, símbolos)

### Validación de Datos
- [x] Zod schemas para todos los inputs
- [x] Sanitización de inputs (SQL injection previene con Kysely)
- [ ] Validación de tamaño de archivos
- [ ] Validación de tipos MIME

### Base de Datos
- [x] Queries parametrizadas (Kysely)
- [x] Multi-tenancy con organization_id
- [ ] Índices apropiados para queries frecuentes
- [ ] Backup automático configurado
- [ ] Conexiones SSL/TLS

### API Security
- [x] Helmet configurado
- [x] Rate limiting (100 req/min)
- [x] CORS configurado
- [ ] Whitelist de IPs (opcional)
- [ ] API versioning

### Secrets y Config
- [ ] Variables de entorno no versionadas
- [ ] Secrets rotados periódicamente
- [ ] .env en .gitignore
- [ ] Secrets en Dokploy/env vars, no en código

### Logging y Monitoreo
- [x] Logs estructurados
- [x] Request IDs para tracking
- [x] Errores no manejados capturados
- [ ] Alertas para errores 5xx
- [ ] Dashboard de métricas

### HTTPS
- [x] SSL/TLS con Let's Encrypt
- [ ] HSTS habilitado
- [ ] Redirección HTTP → HTTPS

### Dependencias
- [ ] Dependencias actualizadas
- [ ] Audit de vulnerabilidades (npm audit)
- [ ] Dependencias innecesarias eliminadas

### Funcionalidades de Riesgo
- [x] Webhooks con firma verificación (Stripe)
- [ ] Rate limiting por usuario
- [ ] Límites en payloads
- [ ] Timeout en operaciones largas

---

## Commands de Verificación

```bash
# Verificar vulnerabilidades
npm audit

# Verificar dependencias desactualizadas
npm outdated

# Verificar configuración de seguridad
# Revisar app.ts para helmet, cors, rate-limit

# Verificar logs en producción
tail -f logs/app.log | jq
```

---

## Notas
- Los items marcados con [x] ya están implementados
- Los items marcados con [ ] requieren atención antes de producción

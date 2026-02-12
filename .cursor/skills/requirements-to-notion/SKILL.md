---
name: requirements-to-notion
description: Convierte archivos MD de requerimientos en épicas e historias de usuario formato Gherkin, y las crea en Notion via API. Usa cuando el usuario mencione requerimientos, historias de usuario, épicas, backlog, user stories, o quiera pasar documentación a Notion.
---

# Requirements to Notion

Convierte requerimientos de proyecto en épicas e historias de usuario estructuradas y las sincroniza con Notion.

## Configuración Inicial de Notion API

Antes de usar este skill, configura las credenciales:

### 1. Crear Integration en Notion

1. Ve a [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Nombre: "Requirements Importer"
4. Selecciona el workspace
5. Capabilities: Read, Update, Insert content
6. Copia el **Internal Integration Token**

### 2. Crear Database en Notion

Crea una base de datos con estas propiedades:

| Propiedad | Tipo | Opciones |
|-----------|------|----------|
| Title | Title | - |
| Type | Select | Epic, Story, Task |
| Status | Select | Backlog, Todo, In Progress, Done |
| Priority | Select | Alta, Media, Baja |
| Estimate | Select | XS, S, M, L, XL |
| Epic | Relation | (self-relation) |
| Module | Select | (dinámico) |
| Acceptance Criteria | Rich Text | - |

### 3. Conectar Database

1. Abre tu database en Notion
2. Click "..." → "Connections" → Agrega tu integration
3. Copia el **Database ID** de la URL: `notion.so/{workspace}/{DATABASE_ID}?v=...`

### 4. Variables de Entorno

Crea archivo `.env` en la raíz del proyecto:

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Instalar Dependencias

```bash
cd .cursor/skills/requirements-to-notion/scripts
pnpm install
```

## Workflow de Conversión

### Paso 1: Validar Archivo de Requerimientos

```bash
node .cursor/skills/requirements-to-notion/scripts/validate_requirements.js requirements.md
```

Verifica que el MD tenga estructura válida para conversión.

### Paso 2: Analizar y Extraer Requerimientos

Lee el archivo MD y extrae:
- **Módulos**: Identificados por encabezados `##`
- **Requerimientos**: Identificados por listas o sub-encabezados `###`
- **Detalles**: Contenido bajo cada requerimiento

### Paso 3: Convertir a Historias de Usuario

Para cada requerimiento, genera:

```markdown
## [Nombre del Módulo] - Epic

### Historia: [Título descriptivo]

**Como** [rol de usuario]
**Quiero** [acción/funcionalidad]
**Para** [beneficio/valor]

#### Criterios de Aceptación (Gherkin)

**Scenario:** [nombre del escenario]
- **Given** [contexto inicial]
- **When** [acción del usuario]
- **Then** [resultado esperado]
- **And** [resultado adicional]

**Estimación:** [XS|S|M|L|XL]
**Prioridad:** [Alta|Media|Baja]
```

### Paso 4: Crear en Notion

```bash
node .cursor/skills/requirements-to-notion/scripts/create_stories.js output.json
```

Opciones disponibles:
- `--dry-run`: Simula la creación sin enviar a Notion

## Guía de Estimación T-Shirt

| Size | Descripción | Ejemplo |
|------|-------------|---------|
| XS | Cambio trivial, < 2 horas | Fix typo, ajuste CSS |
| S | Tarea simple, < 1 día | CRUD básico, validación simple |
| M | Funcionalidad mediana, 2-3 días | Feature con lógica, integraciones simples |
| L | Feature compleja, 1 semana | Módulo nuevo, múltiples integraciones |
| XL | Epic grande, > 1 semana | Sistema completo, refactor mayor |

## Guía de Prioridad

| Prioridad | Criterio |
|-----------|----------|
| **Alta** | Crítico para MVP, bloquea otras tareas, requerimiento del cliente |
| **Media** | Importante pero no bloqueante, mejora significativa |
| **Baja** | Nice-to-have, mejoras menores, puede posponerse |

## Estructura de Entrada Esperada

El archivo MD de requerimientos debe seguir esta estructura:

```markdown
# Nombre del Proyecto

## Módulo 1: [Nombre]
Descripción general del módulo.

### Requerimiento 1.1
Descripción detallada...
- Punto específico
- Otro punto

### Requerimiento 1.2
...

## Módulo 2: [Nombre]
...
```

## Ejemplo de Conversión

**Entrada (requirements.md):**
```markdown
## Módulo: Autenticación

### Login de usuarios
El sistema debe permitir login con email y contraseña.
- Validación de formato de email
- Contraseña mínimo 8 caracteres
- Bloqueo tras 5 intentos fallidos
```

**Salida (Historia de Usuario):**
```markdown
### Historia: Implementar login de usuarios

**Como** usuario registrado
**Quiero** iniciar sesión con mi email y contraseña
**Para** acceder a mi cuenta y funcionalidades del sistema

#### Criterios de Aceptación

**Scenario:** Login exitoso
- **Given** soy un usuario registrado en el sistema
- **When** ingreso mi email y contraseña correctos
- **Then** accedo al dashboard principal
- **And** veo mi nombre en el header

**Scenario:** Validación de email
- **Given** estoy en la página de login
- **When** ingreso un email con formato inválido
- **Then** veo mensaje "Email inválido"

**Scenario:** Bloqueo por intentos fallidos
- **Given** he fallado el login 4 veces
- **When** fallo un quinto intento
- **Then** mi cuenta se bloquea por 15 minutos
- **And** veo mensaje de bloqueo temporal

**Estimación:** S
**Prioridad:** Alta
```

## Verificar Conexión

```bash
node .cursor/skills/requirements-to-notion/scripts/notion_client.js
```

## Recursos Adicionales

- Formato Gherkin detallado: [gherkin-format.md](gherkin-format.md)
- Scripts de automatización en `scripts/`

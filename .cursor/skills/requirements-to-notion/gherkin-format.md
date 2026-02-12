# Formato Gherkin - Referencia

## Estructura Básica

```gherkin
Feature: [Nombre de la funcionalidad]
  Como [rol]
  Quiero [acción]
  Para [beneficio]

  Scenario: [Nombre del escenario]
    Given [precondición]
    When [acción]
    Then [resultado esperado]
```

## Keywords Principales

| Keyword | Español | Uso |
|---------|---------|-----|
| Given | Dado que | Establece el contexto inicial |
| When | Cuando | Describe la acción del usuario |
| Then | Entonces | Define el resultado esperado |
| And | Y | Agrega condiciones adicionales |
| But | Pero | Agrega excepciones o condiciones negativas |

## Buenas Prácticas

### 1. Escenarios Independientes
Cada escenario debe poder ejecutarse de forma aislada.

```gherkin
# ✅ Bueno - escenario autocontenido
Scenario: Usuario crea cuenta nueva
  Given estoy en la página de registro
  When completo el formulario con datos válidos
  Then veo mensaje de confirmación

# ❌ Malo - depende de estado previo
Scenario: Usuario ve su perfil
  Then veo mi información personal
```

### 2. Un Comportamiento por Escenario

```gherkin
# ✅ Bueno - comportamiento específico
Scenario: Login con credenciales válidas
  Given soy un usuario registrado
  When ingreso email y contraseña correctos
  Then accedo al sistema

# ❌ Malo - múltiples comportamientos
Scenario: Login y navegación
  Given soy un usuario registrado
  When ingreso credenciales
  Then accedo al sistema
  When hago click en perfil
  Then veo mis datos
```

### 3. Lenguaje de Negocio

```gherkin
# ✅ Bueno - lenguaje del dominio
Given tengo un carrito con 3 productos
When aplico cupón "DESCUENTO20"
Then el total se reduce un 20%

# ❌ Malo - lenguaje técnico
Given existe registro en tabla cart con 3 items
When POST /api/coupons con body {code: "DESCUENTO20"}
Then response.total == original * 0.8
```

## Patrones Comunes

### Scenario Outline (Múltiples ejemplos)

```gherkin
Scenario Outline: Validación de contraseña
  Given estoy en el formulario de registro
  When ingreso contraseña "<password>"
  Then veo mensaje "<mensaje>"

  Examples:
    | password | mensaje |
    | abc | Mínimo 8 caracteres |
    | 12345678 | Debe incluir letras |
    | Abcd1234 | Contraseña válida |
```

### Background (Setup común)

```gherkin
Background:
  Given soy un usuario autenticado
  And tengo rol de administrador

Scenario: Ver lista de usuarios
  When accedo a /admin/users
  Then veo la tabla de usuarios

Scenario: Crear nuevo usuario
  When hago click en "Nuevo Usuario"
  Then veo el formulario de creación
```

## Mapeo Requerimiento → Gherkin

| Tipo de Requerimiento | Estructura Gherkin |
|----------------------|-------------------|
| Funcionalidad nueva | Feature + Scenarios principales |
| Validación | Scenario con Given/When inválido/Then error |
| Regla de negocio | Scenario Outline con Examples |
| Flujo complejo | Múltiples Scenarios secuenciales |
| Integración | Scenario con Given sistema externo |

## Template de Conversión

```markdown
## Input: Requerimiento
[Descripción del requerimiento]

## Output: Historia + Gherkin

### Historia: [Título accionable]

**Como** [rol identificado o "usuario del sistema"]
**Quiero** [verbo + funcionalidad principal]
**Para** [beneficio de negocio]

#### Criterios de Aceptación

**Scenario:** Caso exitoso (happy path)
- **Given** [estado inicial normal]
- **When** [acción principal]
- **Then** [resultado esperado]

**Scenario:** Validación de entrada
- **Given** [contexto]
- **When** [dato inválido]
- **Then** [mensaje de error específico]

**Scenario:** Caso límite
- **Given** [condición especial]
- **When** [acción]
- **Then** [comportamiento esperado]
```

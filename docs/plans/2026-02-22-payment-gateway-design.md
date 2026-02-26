# Integración de Pasarela de Pagos (Mercado Pago Subscriptions)

## 1. Arquitectura y Componentes
*   **SDK:** Utilizaremos la librería oficial de Node.js `mercadopago` (v2.x).
*   **Base de Datos:** Reutilizaremos las tablas actuales `saas_plans` y `saas_subscriptions`.
    *   *Nota de esquema:* Utilizaremos la columna `stripe_price_id` para guardar el ID del plan de Mercado Pago (llamado *preapproval_plan_id*). Igualmente usaremos `stripe_subscription_id` para el ID de la suscripción de MP.
*   **Nuevos Endpoints Backend:**
    *   `POST /saas-subscription/mp/checkout`: Crea la preferencia de suscripción y devuelve el link de pago (`init_point`) al frontend.
    *   `POST /webhooks/mercadopago`: Endpoint público (sin auth) para recibir los eventos de Mercado Pago.

## 2. Flujo de Datos (Data Flow)
1.  **Frontend:** El usuario selecciona un plan y hace clic en "Suscribirse". El FE llama a `POST /saas-subscription/mp/checkout`.
2.  **Backend:** Busca el plan en BD, usa el SDK de Mercado Pago para generar la suscripción al plan de MP y recibe un link de pago (`init_point`).
3.  **Frontend:** Redirige al usuario a esa URL de Mercado Pago. El usuario paga con tarjeta.
4.  **Webhook (Backend):** Mercado Pago envía un POST a `/webhooks/mercadopago` indicando que la suscripción fue cobrada con éxito.
5.  **Activación:** El backend procesa el webhook, busca la organización en la BD y actualiza el estado de `saas_subscriptions` a `active`.

## 3. Manejo de Errores y Seguridad (Error Handling)
*   **Firmas Webhooks:** Validaremos la firma secreta de Mercado Pago en el webhook para asegurar que las peticiones vengan realmente de ellos (usando la cabecera `x-signature`).
*   **Control de Concurrencia:** Verificaremos que un usuario no cree suscripciones duplicadas mientras espera el webhook.
*   **Eventos de Pago Fallido:** Si la tarjeta falla en la renovación mensual, MP enviará un evento y actualizaremos la suscripción a `past_due` o `canceled` para cortar el acceso.

## 4. Pruebas (Testing)
*   Utilizaremos el **entorno de Sandbox** de Mercado Pago (credenciales Test).
*   Para probar webhooks en local, usaremos `ngrok` o una herramienta similar para exponer el puerto local a internet antes de subir a producción.

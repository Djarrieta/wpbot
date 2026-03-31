# Tareas pendientes

---

## Tarea 2: Sistema de resumen (summary) en chat_history

**Problema:** Se inyectan los últimos 20 mensajes completos en cada prompt. Conversaciones largas consumen tokens innecesariamente.

**Diseño elegido:** Registro especial en `chat_history` con `role = 'summary'` que marca el punto de corte.

**Cambios:**

1. **Tipo `ChatHistory`** (`packages/shared/src/types.ts`) — Agregar `'summary'` al tipo `role`.

2. **`packages/api/src/modules/chathistory/service.ts`**:
   - Modificar `initializeTable()`: el campo `role` ya acepta texto libre, no hay restricción de CHECK.
   - Nuevo método `getLatestSummary(userId)`: obtiene el summary más reciente del usuario.
   - Nuevo método `getMessagesSinceSummary(userId)`: obtiene mensajes posteriores al último summary.
   - Nuevo método `saveSummary(userId, summaryText)`: guarda un registro con `role='summary'`.
   - Nuevo método `shouldSummarize(userId)`: retorna true si hay más de 30 mensajes sin resumir.

3. **`packages/api/src/controllers/assistantController.ts`** — Modificar `buildPrompt()`:
   - Si existe un summary para el usuario: inyectar `"RESUMEN DE CONVERSACIÓN ANTERIOR:\n{summary}\n\nCONVERSACIÓN RECIENTE:\n{mensajes_nuevos}"`.
   - Si no hay summary: inyectar historial completo (comportamiento actual).
   - Después de generar la respuesta en `handle()`, verificar si se debe generar summary. Si sí, invocar al LLM para resumir y guardarlo.

4. **Umbral:** 30 mensajes sin resumir disparan la generación automática del summary.

---

## Tarea 13: Requerir datos del usuario (nombre y teléfono) antes de crear una orden

**Problema:** El bot actualmente crea la orden sin antes solicitar los datos personales del cliente (nombre y teléfono). Estos datos son necesarios para procesar el pedido y coordinar la entrega. El bot debería preguntar por esta información **antes** de ejecutar el INSERT en `orders`, no después.

**Solución:** Modificar el prompt del asistente (`packages/api/src/prompts.ts`) para que incluya instrucciones explícitas de recolección de datos obligatorios antes de crear la orden.

### Cambios

1. **`packages/api/src/prompts.ts`** — Agregar una sección de **FLUJO DE CREACIÓN DE ORDEN** al prompt con estas reglas:
   - **Antes de crear cualquier orden**, el asistente DEBE verificar que tiene la siguiente información del cliente:
     - Nombre completo
     - Número de teléfono/celular
     - Ciudad de envío
     - Dirección de envío
     - Método de pago
   - Si alguno de estos datos falta, el asistente DEBE pedirlos al usuario **antes** de ejecutar cualquier INSERT en `orders`.
   - El asistente puede consultar la tabla `users` (campo `name`, `phone`) y el campo `collected_info` de órdenes anteriores del usuario para pre-llenar datos ya conocidos. Si los encuentra, debe confirmarlos con el usuario: "Tengo registrado tu nombre como X y tu teléfono como Y, ¿son correctos para esta orden?"
   - Solo cuando tenga **todos** los datos requeridos puede proceder a crear la orden.
   - Al crear la orden, guardar nombre y teléfono en `collected_info` del registro de la orden.

### Notas

- No requiere cambios en la base de datos ni en la API, solo en el prompt.
- El campo `collected_info` (JSONB) en `orders` ya existe y soporta almacenar estos datos.
- Si el usuario ya proporcionó los datos en la conversación (ej: "soy Juan, mi cel es 300..."), el bot debe usarlos sin volver a preguntar.

---

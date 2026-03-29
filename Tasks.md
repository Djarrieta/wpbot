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

## Tarea 10: Paginación en tablas del admin (API + UI)

**Problema:** Actualmente `getAll()` en la API retorna **todos** los registros sin límite, y el componente `Table` en la UI los renderiza todos de golpe. Con tablas como `items` (30+ registros), `orders`, `chat_history` (crecimiento ilimitado), esto se vuelve lento e inutilizable.

**Diseño:**

Paginación server-side con query params `page` y `limit`. La API retorna un objeto con metadata de paginación. La UI muestra controles de página.

### Cambios en la API

1. **`packages/api/src/core/repository.ts`** — Definir nuevo tipo e interfaz:

   ```typescript
   export interface PaginatedResult<T> {
     data: T[];
     total: number;
     page: number;
     limit: number;
     totalPages: number;
   }
   ```

   Agregar método abstracto `getAllPaginated(page, limit, filter?)` que retorna `PaginatedResult<T>`.

2. **`packages/api/src/core/pgRepository.ts`** — Implementar `getAllPaginated()`:
   - Ejecutar `SELECT COUNT(*) ...` (con filtros si aplica) para obtener `total`.
   - Ejecutar `SELECT * ... ORDER BY id DESC LIMIT $X OFFSET $Y` para obtener `data`.
   - Calcular `totalPages = Math.ceil(total / limit)`.
   - Retornar `{ data, total, page, limit, totalPages }`.

3. **`packages/api/src/core/crudController.ts`** — Modificar `getAll()`:
   - Leer `page` y `limit` de query params (`page` default `1`, `limit` default `20`).
   - Validar que sean enteros positivos; si no, usar defaults.
   - Si se reciben `page`/`limit`: llamar a `service.getAllPaginated(page, limit, filter)` y retornar el objeto paginado.
   - Si NO se reciben `page`/`limit`: mantener el comportamiento actual (`service.getAll(filter)` retornando array plano) para no romper el AI assistant que usa la misma API.

### Cambios en la UI (Web)

4. **`packages/web/src/lib/createApiClient.ts`** — Agregar tipo `PaginatedResponse<T>` y nuevo método `fetchPaginated(params)` que retorna `PaginatedResponse<T>` (con `data`, `total`, `page`, `limit`, `totalPages`). Mantener `fetchAll()` intacto para no romper otros usos.

5. **`packages/web/src/components/Table.tsx`** — Agregar props opcionales de paginación:
   - `page?: number`, `totalPages?: number`, `onPageChange?: (page: number) => void`.
   - Si se pasan, renderizar un footer con controles: botones "Anterior" / "Siguiente", indicador "Página X de Y".
   - Estilo consistente con el diseño actual (gray borders, dark mode support).

6. **`packages/web/src/components/CrudPage.tsx`** — Integrar paginación:
   - Nuevo estado: `page` (default 1), `totalPages`, `limit` (default 20).
   - Cambiar `loadData()` para usar `api.fetchPaginated({ page, limit })` y guardar `totalPages`.
   - Pasar `page`, `totalPages`, `onPageChange` al componente `Table`.
   - Al crear/eliminar registros, recargar la página actual.

### Notas

- El `limit` por defecto de 20 es razonable para todas las tablas actuales.
- `ORDER BY id DESC` muestra los registros más recientes primero (útil para orders, chat_history).
- El endpoint de la API sigue compatible: sin `page`/`limit` retorna array plano (para el AI assistant), con `page`/`limit` retorna objeto paginado (para la UI admin).

---

## Tarea 13: Rastreo de imagen personalizada en order_items para productos personalizados

**Problema:** Los productos "Funda 3D Personalizada" y "Skin impreso Personalizado" requieren que el cliente envíe una imagen con su diseño. Actualmente no hay forma de saber si el cliente ya envió la imagen o no. El asistente necesita un campo en `order_items` para registrar que la imagen fue recibida, y el flujo de recolección de información debe incluir un paso explícito para solicitar y confirmar la imagen.

**Aclaraciones:**

- El asistente **NO debe validar** el contenido de la imagen (no analiza si es apropiada, si tiene buena resolución, etc.). Solo necesita saber que el usuario envió una imagen.
- Los canales (WhatsApp, Telegram, Web) deben detectar cuando el usuario envía una imagen y notificar a la API que se recibió una imagen en el contexto de la conversación.
- El campo `image_sent` es un booleano en `order_items` que indica si el cliente ya envió la imagen para ese item personalizado.

**Productos que requieren imagen:**

- Items con name que contenga "Personalizado/a" (actualmente: "Skin impreso Personalizado", "Funda 3D Personalizada").
- Regla general: si el item tiene "personaliz" en su nombre (case-insensitive), requiere imagen.

**Cambios:**

### 1. Base de datos y tipos

1. **`packages/api/scripts/seed.ts`** — Agregar campo `image_sent BOOLEAN NOT NULL DEFAULT false` a la tabla `order_items` en el CREATE TABLE.

2. **`packages/shared/src/types.ts`** — Agregar `image_sent?: boolean` al tipo `OrderItem`:

   ```typescript
   export type OrderItem = {
     id?: number;
     order_id: number;
     item_id: number;
     quantity: number;
     unit_price: number;
     device_reference?: string;
     image_sent?: boolean;
   };
   ```

3. **`packages/api/src/modules/order_items/service.ts`** — Agregar `image_sent` al schema de la tabla (campo `BOOLEAN NOT NULL DEFAULT false`).

4. **`packages/api/src/modules/order_items/controller.ts`** — Agregar `'image_sent'` al array de `fieldNames` del constructor.

### 2. Prompt del asistente y flujo de orden

5. **`packages/api/src/prompts.ts`** — En la sección ESTRUCTURA DE ÓRDENES, actualizar la descripción de `order_items` para incluir `image_sent`:
   - `"La tabla "order_items" contiene [...] image_sent (booleano: indica si el cliente envió la imagen para productos personalizados)."`

6. **`packages/api/scripts/seed.ts`** — Actualizar el contexto `flujo_creacion_orden`:

   **PASO 2 (PRODUCTO DESEADO)** — Después de la línea sobre diseño personalizado, agregar:
   - `"Si el producto es personalizado (el nombre contiene 'Personalizado/a'), el cliente DEBERÁ enviar una imagen con su diseño. Infórmale que necesita enviar la imagen. NO valides el contenido de la imagen."`

   **Nuevo PASO intermedio (entre PASO 2 y PASO 3 actual) — IMAGEN PERSONALIZADA:**

   ```
   PASO 2.5 — IMAGEN PERSONALIZADA (solo productos personalizados):
   - Si el producto seleccionado es personalizado, pídele al cliente que envíe la imagen que quiere usar para su diseño.
   - Cuando el cliente envíe una imagen (el sistema te indicará con un mensaje "[imagen recibida]"), confirma la recepción y registra que la imagen fue recibida.
   - NO analices ni valides el contenido de la imagen. Solo necesitas saber que fue enviada.
   - Si el cliente envía texto en vez de imagen, recuérdale amablemente que necesitas la imagen como archivo adjunto.
   - Puedes continuar con los demás pasos mientras esperas la imagen, pero NO crees la orden sin que la imagen haya sido enviada para items personalizados.
   ```

   **PASO 8 (CREACIÓN DE LA ORDEN)** — Agregar instrucción:
   - `"Para items personalizados, incluye image_sent = true en el INSERT de order_items si el cliente ya envió la imagen. Si no la ha enviado, recuérdale antes de crear la orden."`

### 3. Canales de mensajería — detección de imágenes

7. **`packages/whatsapp/src/webhook.ts`** — Actualmente `parseIncomingMessage` descarta mensajes que no son de tipo `text` (retorna `null`). Modificar para detectar mensajes de tipo `image`:
   - Si `message.type === 'image'`, retornar `{ from, text: "[imagen recibida]" }`.
   - Esto permite que la imagen llegue al asistente como un mensaje de texto especial que el prompt puede interpretar.

8. **`packages/telegram/index.ts`** — Aplicar la misma lógica: si el mensaje contiene una foto (`message.photo`), enviar `"[imagen recibida]"` como texto al asistente.

9. **`packages/web/src/App.tsx`** (o el componente de chat) — Si existe un input de chat en la web, agregar un botón para adjuntar imagen. Al enviar una imagen, enviar `"[imagen recibida]"` como mensaje al API.

### 4. UI Admin

10. **`packages/web/src/modules/order_items/Page.tsx`** — Agregar columna `image_sent` a la tabla:

    ```typescript
    { key: "image_sent", header: "Imagen Enviada" }
    ```

11. **`packages/web/src/modules/order_items/Form.tsx`** — Agregar campo checkbox `image_sent` al formulario:
    ```typescript
    {
      name: "image_sent",
      label: "Imagen enviada",
      type: "checkbox",
    }
    ```

### Notas

- El patrón `[imagen recibida]` es un marcador textual que los canales inyectan cuando detectan una imagen. El asistente AI lo interpreta como confirmación de que la imagen fue enviada. No se almacena la imagen en sí — solo el flag booleano.
- En esta primera versión no se almacena la imagen. El flujo real de producción implica que el operador revisa las imágenes directamente desde WhatsApp/Telegram. El campo `image_sent` solo sirve para que el asistente y el admin sepan que el cliente cumplió con enviar su diseño.
- Los productos no personalizados ignoran este campo (queda en `false` por defecto, sin impacto).
- `DEFAULT false` asegura compatibilidad con order_items existentes.
- Requiere `bun db:reset` para recrear la tabla con el nuevo campo.

## Tarea 15: Debounce de mensajes — evitar respuestas duplicadas cuando el usuario envía varios mensajes seguidos

**Problema:** Cuando un usuario envía varios mensajes rápido (ej. "hola", "quiero pedir", "un skin para mi S24"), cada mensaje dispara una llamada independiente a `/assistant`. El asistente procesa cada uno por separado y responde múltiples veces, frecuentemente con respuestas repetitivas o incompletas (porque cada mensaje individual carece del contexto de los demás).

**Ejemplo actual (incorrecto):**

```
Usuario: hola
Usuario: quiero un skin
Usuario: para mi samsung s24
Asistente: ¡Hola! ¿En qué puedo ayudarte?
Asistente:¡Hola! ¿En qué puedo ayudarte?¿Para qué modelo de celular lo necesitas?
Asistente: ¡Hola! Tenemos el Skin Fibra de Carbono disponible para Samsung Galaxy S24...
```

**Comportamiento esperado:**

```
Usuario: hola
Usuario: quiero un skin
Usuario: para mi samsung s24
Asistente: ¡Hola! Tenemos el Skin Fibra de Carbono disponible para Samsung Galaxy S24...
```

**Diseño elegido:** Debounce a nivel de canal (Telegram y WhatsApp). Cada canal acumula mensajes del mismo usuario en un buffer temporal. Después de un período de inactividad (ventana de debounce), combina todos los mensajes acumulados en uno solo y hace una única llamada a `/assistant`.

**¿Por qué en el canal y no en la API?**

- Cada canal ya maneja el envío de respuestas al usuario (Telegraf `ctx.reply`, WhatsApp `sendMessage`). Si el debounce estuviera en la API, habría que resolver cómo devolver la respuesta HTTP de forma asíncrona, ya que cada mensaje es un request HTTP independiente.
- WhatsApp requiere responder 200 inmediatamente al webhook de Meta. El procesamiento ya es asíncrono de hecho.
- No se requiere cambiar el contrato de la API.

**Parámetros:**

- Ventana de debounce: **3 segundos** (configurable via env `DEBOUNCE_MS`, default `3000`).
- Combinación: los mensajes acumulados se unen con `\n` en orden cronológico.

**Cambios:**

### 1. Telegram (`packages/telegram/index.ts`)

Agregar un `Map<number, { messages: string[], timer: Timer, ctx: Context }>` como buffer por usuario (keyed por `userId` de Telegram).

Modificar el handler `bot.on(message("text"), ...)`:

```typescript
const DEBOUNCE_MS = Number(optionalEnv("DEBOUNCE_MS", "3000"));

const pendingMessages = new Map<
  number,
  {
    messages: string[];
    timer: Timer;
    ctx: any;
    name?: string;
  }
>();

bot.on(message("text"), async (ctx) => {
  const user = ctx.from;
  if (!user) {
    await ctx.reply(
      "Estoy teniendo problemas en el sistema. Dame un momento por favor.",
    );
    return;
  }

  const userId = user.id;
  const name =
    user.username ||
    [user.first_name, user.last_name].filter(Boolean).join(" ");
  const userMessage = ctx.message.text;
  console.log(`Message from ${userId} (${name}): ${userMessage}`);

  const pending = pendingMessages.get(userId);
  if (pending) {
    // Ya hay mensajes pendientes: acumular y resetear timer
    pending.messages.push(userMessage);
    pending.ctx = ctx; // usar el ctx más reciente para responder
    clearTimeout(pending.timer);
    pending.timer = setTimeout(() => processMessages(userId), DEBOUNCE_MS);
  } else {
    // Primer mensaje: crear buffer e iniciar timer
    pendingMessages.set(userId, {
      messages: [userMessage],
      timer: setTimeout(() => processMessages(userId), DEBOUNCE_MS),
      ctx,
      name: name || undefined,
    });
  }
});

async function processMessages(userId: number) {
  const pending = pendingMessages.get(userId);
  if (!pending) return;
  pendingMessages.delete(userId);

  const combinedMessage = pending.messages.join("\n");
  const { ctx, name } = pending;

  console.log(
    `Processing ${pending.messages.length} buffered message(s) from ${userId}`,
  );

  try {
    await ctx.sendChatAction("typing");
    const responseText = await callAssistant(combinedMessage, userId, name);
    await ctx.reply(responseText);
  } catch (error) {
    console.error("Error processing message:", error);
    await ctx.reply("Lo siento, hubo un error procesando tu mensaje.");
  }
}
```

### 2. WhatsApp (`packages/whatsapp/src/webhook.ts`)

Mismo patrón. Agregar un `Map<string, { messages: string[], timer: Timer }>` como buffer por número de teléfono.

Modificar `handleWebhook`:

```typescript
const DEBOUNCE_MS = Number(optionalEnv("DEBOUNCE_MS", "3000"));

const pendingMessages = new Map<
  string,
  {
    messages: string[];
    timer: Timer;
  }
>();

async function processMessages(phoneNumber: string) {
  const pending = pendingMessages.get(phoneNumber);
  if (!pending) return;
  pendingMessages.delete(phoneNumber);

  const combinedMessage = pending.messages.join("\n");
  console.log(
    `Processing ${pending.messages.length} buffered message(s) from ${phoneNumber}`,
  );

  const responseText = await callAssistant(combinedMessage, phoneNumber);
  await sendMessage(phoneNumber, responseText);
}

export async function handleWebhook(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const message = parseIncomingMessage(body);

    if (message) {
      const pending = pendingMessages.get(message.from);
      if (pending) {
        pending.messages.push(message.text);
        clearTimeout(pending.timer);
        pending.timer = setTimeout(
          () => processMessages(message.from),
          DEBOUNCE_MS,
        );
      } else {
        pendingMessages.set(message.from, {
          messages: [message.text],
          timer: setTimeout(() => processMessages(message.from), DEBOUNCE_MS),
        });
      }
    }

    // Siempre responder 200 inmediatamente a Meta
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("OK", { status: 200 });
  }
}
```

### Notas

- La ventana de 3 segundos es un balance: lo suficientemente corta para no sentirse lenta, lo suficientemente larga para capturar una ráfaga de mensajes típica.
- El buffer vive en memoria del proceso. Si el proceso se reinicia, se pierden los mensajes pendientes (aceptable — son solo unos segundos de ventana).
- El web client NO necesita debounce porque su interfaz de chat manda un mensaje a la vez (el usuario escribe y presiona Enter con todo el texto completo).
- Los mensajes combinados se unen con `\n`, lo cual el LLM interpreta naturalmente como un mensaje multi-línea.
- El indicador "typing" (Telegram) se envía al procesar, no cuando llega el primer mensaje. Esto evita que el usuario vea "escribiendo..." durante la ventana de acumulación.
- `handleWebhook` ya respondía 200 inmediatamente, así que el debounce no afecta el requisito de Meta de respuestas rápidas.
- Si el usuario envía un solo mensaje, simplemente se procesa después de 3 segundos (delay mínimo aceptable).

---

## Tarea 13: Incluir imágenes de productos al presentar opciones al cliente

**Problema:** Cuando el asistente le presenta opciones de productos al cliente (ej: tipos de skins texturizados, fundas disponibles, etc.), solo muestra texto con nombres y descripciones. El cliente no puede ver cómo luce el producto antes de elegir, lo que dificulta la decisión de compra.

**Mejora:** El asistente debe consultar el campo `image_url` de la tabla `items` y incluir el link de la imagen junto a cada opción que presente. Así el cliente puede ver visualmente el producto antes de decidir.

**Cambios:**

### Contexto inyectado (seed — `contextData`)

1. **`packages/api/scripts/seed.ts`** — Agregar un nuevo contexto en `contextData` con `always_inject: true` que instruya al asistente sobre el uso de imágenes:

   ```typescript
   {
     topic: "presentacion_productos_con_imagenes",
     content: `REGLA DE PRESENTACIÓN DE PRODUCTOS CON IMÁGENES:

   Cada vez que presentes opciones de productos al cliente (skins, fundas, carcasas, etc.), DEBES:
   1. Consultar la tabla "items" para obtener el campo "image_url" de cada producto relevante.
   2. Incluir el link de la imagen junto a cada opción presentada, para que el cliente pueda ver cómo luce el producto.
   3. El formato para presentar cada opción debe ser:
      - Nombre del producto — breve descripción
      - Precio: $XX,XXX COP
      - Ver imagen: [link de image_url]

   Ejemplo de presentación:
   1. **Skin Fibra de Carbono** — acabado sofisticado con textura de fibra de carbono
      💰 $25,000 COP
      📸 Ver imagen: https://ejemplo.com/imagen-fibra-carbono.jpg

   2. **Skin Cuero Negro** — textura de cuero negro premium
      💰 $28,000 COP
      📸 Ver imagen: https://ejemplo.com/imagen-cuero-negro.jpg

   IMPORTANTE:
   - SIEMPRE consulta la imagen del item desde la base de datos (SELECT image_url FROM items WHERE ...). NO inventes URLs de imágenes.
   - Si un item no tiene image_url (campo vacío), simplemente omite la línea de imagen para ese producto.
   - Aplica esta regla en TODOS los momentos donde presentes opciones: al listar tipos de productos, al mostrar disponibilidad, al sugerir alternativas, etc.`,
     always_inject: true,
   },
   ```

### Prompt del asistente

2. **`packages/api/src/prompts.ts`** — En la sección `ESQUEMA DE LA BASE DE DATOS` o `INSTRUCCIONES`, agregar una instrucción explícita:

   ```
   - Cuando presentes opciones de productos al cliente, consulta el campo "image_url" de la tabla "items" e incluye el link de la imagen junto a cada opción. Esto permite al cliente ver el producto antes de elegir. Si image_url está vacío, omite la imagen para ese producto.
   ```

### Notas

- El campo `image_url` ya existe en la tabla `items` y está poblado en el seed con URLs de ejemplo.
- El cambio principal es en el prompt/contexto inyectado: instruir al asistente para que SIEMPRE consulte y muestre `image_url` al presentar opciones.
- No se requieren cambios en la estructura de la base de datos ni en la API.
- Requiere `bun db:reset` para que el nuevo contexto se inserte en la tabla `context`.

---

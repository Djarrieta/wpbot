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

## Tarea 16: Escalamiento a humano — campo `requires_human` y manejo de errores transparente

**Problema:** Actualmente no existe un mecanismo para escalar una conversación a atención humana. Si el asistente AI no puede resolver algo, o si ocurre un error técnico (fallo de API, timeout del LLM, etc.), el sistema responde con mensajes genéricos de error como "Lo siento, hubo un error procesando tu mensaje." que rompen la ilusión de una conversación natural. El cliente NO debe notar que habla con un bot.

**Objetivos:**

1. Cuando ocurra cualquier error técnico, el cliente recibe una respuesta amigable tipo "Dame un momento por favor, estoy validando la información" en vez de un mensaje de error.
2. Introducir un campo `requires_human` en `chat_history` que indica que la conversación necesita intervención humana.
3. Si la última respuesta del asistente fue el mensaje de "espera" (indicando que hubo un error previo), los mensajes siguientes del mismo usuario NO deben procesarse con AI — se mantiene el bloqueo hasta que un humano intervenga.
4. Un operador puede desbloquear la conversación desde el admin.

**Mensaje estándar de espera:**

```
Dame un momento por favor, estoy validando la información.
```

Este es el mensaje que se envía al cliente en cualquier situación de error o escalamiento. Es intencionalmente vago y natural — suena como algo que un humano diría.

**Flujo detallado:**

```
1. Llega mensaje del usuario
2. Consultar el último registro de chat_history del usuario donde role = 'assistant'
3. SI el último mensaje del asistente === "Dame un momento por favor, estoy validando la información."
   → NO procesar con AI
   → Marcar requires_human = true en ese registro (si no lo está ya)
   → NO responder nada al usuario (silencio — ya le dijimos que espere)
   → FIN
4. SI NO → procesar normalmente con AI
5. SI hay error durante el procesamiento (AI falla, timeout, error 500, etc.):
   → Guardar mensaje del usuario en chat_history normalmente
   → Guardar respuesta "Dame un momento por favor, estoy validando la información." como role = 'assistant' con requires_human = true
   → Enviar ese mensaje al cliente
   → FIN
6. SI procesamiento exitoso → flujo normal (guardar respuesta, enviarla)
```

**Cambios:**

### 1. Base de datos y tipos

1. **`packages/shared/src/types.ts`** — Agregar `requires_human?: boolean` al tipo `ChatHistory`:

   ```typescript
   export type ChatHistory = {
     id?: number;
     user_id: number;
     message: string;
     role: "user" | "assistant";
     timestamp: string;
     requires_human?: boolean;
   };
   ```

2. **`packages/api/scripts/seed.ts`** — Agregar campo `requires_human BOOLEAN NOT NULL DEFAULT false` a la tabla `chat_history` en el CREATE TABLE.

3. **`packages/api/src/modules/chathistory/service.ts`** — Agregar `requires_human` al schema de la tabla (campo `BOOLEAN NOT NULL DEFAULT false`).

4. **`packages/api/src/modules/chathistory/controller.ts`** — Agregar `'requires_human'` al array de `fieldNames` del constructor.

### 2. Nuevos métodos en chathistory service

5. **`packages/api/src/modules/chathistory/service.ts`** — Nuevos métodos:
   - `getLastAssistantMessage(userId: number)`: retorna el último registro de `chat_history` donde `user_id = userId` y `role = 'assistant'`, ordenado por `id DESC`, `LIMIT 1`.
   - `markRequiresHuman(messageId: number)`: actualiza `requires_human = true` en el registro con ese `id`.
   - `isConversationBlocked(userId: number)`: verifica si el último mensaje del asistente es el mensaje de espera ("Dame un momento por favor, estoy validando la información."). Retorna `true` si la conversación está bloqueada.
   - `unblockConversation(userId: number)`: busca el último registro con `requires_human = true` para ese usuario y lo actualiza a `false`. Esto permite que el operador desbloquee la conversación desde el admin.

### 3. Modificar el flujo del asistente

6. **`packages/api/src/controllers/assistantController.ts`** — Modificar `handle()`:

   **Antes de procesar con AI**, agregar verificación:

   ```
   - Obtener el último mensaje del asistente para este usuario (getLastAssistantMessage)
   - Si el mensaje === "Dame un momento por favor, estoy validando la información.":
     → Marcar requires_human = true en ese registro
     → Guardar el mensaje del usuario en chat_history (para que no se pierda)
     → Retornar respuesta vacía o un indicador de "bloqueado" (no enviar nada al cliente)
   ```

   **En el catch de errores**, cambiar el manejo:

   ```
   - Guardar el mensaje del usuario en chat_history normalmente
   - Guardar "Dame un momento por favor, estoy validando la información." como respuesta del asistente con requires_human = true
   - Retornar ese mensaje como respuesta (para que el canal lo envíe al cliente)
   - NO retornar HTTP 500 — retornar 200 con el mensaje de espera como respuesta normal
   ```

7. **Definir constante** en `packages/api/src/constants.ts`:
   ```typescript
   export const HUMAN_ESCALATION_MESSAGE =
     "Dame un momento por favor, estoy validando la información.";
   ```

### 4. Canales de mensajería — manejo de respuestas vacías/bloqueadas

8. **`packages/telegram/index.ts`** — Modificar `callAssistant()` y el manejo de respuesta:
   - Si la API retorna un indicador de "bloqueado" (ej: `{ response: "", blocked: true }`), NO enviar nada al usuario (silencio).
   - Eliminar el mensaje de error genérico "Lo siento, hubo un error procesando tu mensaje." — ahora la API siempre retorna 200 con un mensaje válido o indicador de bloqueo.

9. **`packages/whatsapp/src/webhook.ts`** — Misma lógica: si la respuesta indica bloqueo, no enviar nada. Eliminar mensaje de error genérico.

10. **`packages/web/src/App.tsx`** — Si hay chat web, aplicar misma lógica: si respuesta bloqueada, no mostrar nada nuevo.

### 5. UI Admin — visibilidad de conversaciones escaladas

11. **`packages/web/src/modules/chathistory/Page.tsx`** — Agregar columna `requires_human` a la tabla:

    ```typescript
    { key: "requires_human", header: "Requiere Humano" }
    ```

12. **`packages/web/src/modules/chathistory/Form.tsx`** — Agregar campo checkbox `requires_human` al formulario para que el operador pueda marcarlo/desmarcarlo manualmente:
    ```typescript
    {
      name: "requires_human",
      label: "Requiere atención humana",
      type: "checkbox",
    }
    ```

### 6. Endpoint para desbloquear conversación (opcional pero recomendado)

13. **`packages/api/src/modules/chathistory/controller.ts`** — Agregar ruta custom `POST /chat_history/unblock/:userId`:
    - Llama a `chatHistoryService.unblockConversation(userId)`.
    - Opcionalmente inserta un mensaje del asistente tipo "Listo, ya puedo ayudarte. ¿En qué te puedo colaborar?" para reanudar la conversación naturalmente cuando el operador resuelva el tema.
    - Retorna `{ success: true }`.

### Notas

- El mensaje "Dame un momento por favor, estoy validando la información." es intencionalmente genérico y humano. Suena natural tanto para un error técnico como para una pausa genuina. El cliente no tiene forma de distinguirlo de una respuesta humana real.
- El silencio en mensajes subsecuentes (cuando la conversación está bloqueada) es intencional: ya le dijimos "dame un momento", responder de nuevo sería extraño. El operador humano debería intervenir directamente por el canal correspondiente.
- `requires_human = false` por defecto asegura compatibilidad con registros existentes.
- La API NUNCA retorna HTTP 500 al canal por errores del AI — siempre retorna 200 con el mensaje de espera. Esto evita que los canales muestren sus propios mensajes de error genéricos.
- El operador puede ver conversaciones escaladas filtrando `requires_human = true` en el admin de `chat_history`.
- Requiere `bun db:reset` para recrear la tabla con el nuevo campo.

---

## Tarea 17: Escalamiento a logística cuando la ciudad de envío no está en la tabla shipping

**Problema:** Cuando el cliente indica una ciudad de envío que no existe en la tabla `shipping` (ej: Rionegro, Bucaramanga, Pereira, etc.), el asistente actualmente responde algo como "Rionegro no está en nuestra tabla de envíos. El envío es posible pero el costo y tiempo deben cotizarse aparte" y luego continúa preguntando la dirección exacta. Esto es incorrecto porque:

1. El asistente NO tiene forma de cotizar el envío — no tiene esa información.
2. Continuar el flujo sin costo de envío genera un resumen incompleto (sin costo total real).
3. El cliente queda en un limbo donde la orden se crearía sin datos de envío verificados.

**Comportamiento esperado:**

```
Asistente: ¿A qué ciudad necesitas el envío?
Cliente: Rionegro
Asistente: Dame un momento por favor, valido con el área de logística el costo de envío a Rionegro.
[conversación pausada — se marca requires_human = true]
```

El asistente debe **pausar la conversación** y escalar a un humano para que el área de logística cotice el envío manualmente. Una vez el operador tenga el costo, puede desbloquear la conversación y continuar.

**Relación con Tarea 16:** Esta tarea depende del sistema de escalamiento humano de Tarea 16 (`requires_human`). El flujo de ciudad no encontrada es un **caso específico** de escalamiento — usa el mismo mecanismo de bloqueo, pero con un mensaje contextualizado al envío en lugar del mensaje genérico de error.

**Cambios:**

### 1. Prompt del asistente — modificar PASO 5

1. **`packages/api/scripts/seed.ts`** — En el contexto `flujo_creacion_orden`, modificar **PASO 5 — CIUDAD DE ENTREGA**:

   **Actual:**

   ```
   - Si la ciudad no está en la tabla, informa que el envío es posible pero el costo y tiempo deben cotizarse aparte.
   ```

   **Nuevo:**

   ```
   - Si la ciudad no está en la tabla "shipping", responde EXACTAMENTE: "Dame un momento por favor, valido con el área de logística el costo de envío a [ciudad]." (reemplazando [ciudad] por la ciudad que indicó el cliente). NO continúes con los siguientes pasos. NO preguntes la dirección. La conversación queda pausada hasta que un operador valide el costo de envío.
   - IMPORTANTE: No improvises ni intentes cotizar tú mismo. Solo las ciudades que están en la tabla "shipping" tienen costo/tiempo definido. Para el resto, se requiere validación manual del equipo de logística.
   ```

### 2. Detección del mensaje de escalamiento en el flujo del asistente

2. **`packages/api/src/controllers/assistantController.ts`** — Después de que el AI genere su respuesta en `handle()`, verificar si la respuesta contiene el patrón de escalamiento de logística:
   - Si la respuesta del AI contiene "valido con el área de logística el costo de envío", marcar `requires_human = true` en el registro de `chat_history` correspondiente a esa respuesta.
   - Esto aprovecha el mecanismo de Tarea 16: la próxima vez que el usuario envíe un mensaje, el sistema detectará que la última respuesta del asistente tiene `requires_human = true` y no procesará con AI.

   **Alternativa más simple (recomendada):** En vez de detectar el patrón en el texto, hacer que el asistente use el mismo mensaje estándar de Tarea 16 ("Dame un momento por favor, estoy validando la información.") para que el flujo de bloqueo funcione automáticamente. Pero esto pierde el contexto de "logística" en el mensaje. La detección por patrón parcial es más natural para el cliente.

3. **`packages/api/src/constants.ts`** — Agregar constante para el patrón de detección:
   ```typescript
   export const LOGISTICS_ESCALATION_PATTERN =
     "valido con el área de logística";
   ```

### 3. Lógica de post-procesamiento

4. **`packages/api/src/controllers/assistantController.ts`** — En `handle()`, después de guardar la respuesta del asistente en `chat_history`:
   - Verificar si `response.includes(LOGISTICS_ESCALATION_PATTERN)`.
   - Si es así, actualizar el registro recién creado con `requires_human = true`.
   - Esto bloquea la conversación hasta que un operador la desbloquee.

### Notas

- **Depende de Tarea 16**: el campo `requires_human` y el mecanismo de bloqueo/desbloqueo deben estar implementados primero.
- El mensaje "Dame un momento por favor, valido con el área de logística el costo de envío a [ciudad]" es más informativo que el mensaje genérico de Tarea 16. El cliente sabe específicamente por qué debe esperar — validación de logística, no un error genérico.
- El operador puede ver en el admin que la conversación está bloqueada, leer el historial para ver qué ciudad pidió el cliente, cotizar el envío, y luego desbloquear la conversación respondiendo con el costo.
- No se requieren cambios en la tabla `shipping` ni en su servicio. El cambio es puramente en el prompt/contexto y en la lógica de detección post-respuesta del asistente.
- Requiere `bun db:reset` para actualizar el contexto `flujo_creacion_orden` con las nuevas instrucciones del PASO 5.

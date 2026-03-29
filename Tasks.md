# Tareas pendientes

---

## Tarea 12: Guardar nombre del item en `order_items` y mostrarlo en la UI

**Problema:** La tabla `order_items` solo guarda `item_id` como referencia al producto, pero no persiste el nombre del item. Esto causa dos problemas:

1. **En la UI admin**, la tabla de Order Items muestra `item_id` (un número) en lugar del nombre del producto, lo cual no es informativo para el administrador.
2. **Si un item se renombra o elimina**, se pierde la referencia de qué producto se ordenó originalmente. El nombre debe quedar "congelado" al momento de agregar el item a la orden (snapshot del nombre).

**Modelo correcto:** Al insertar un `order_item`, se debe copiar el `name` del item referenciado y guardarlo en un campo `item_name` de `order_items`. Así la orden preserva la información original independientemente de cambios futuros en el catálogo.

**Cambios:**

### Base de datos y tipos

1. **`packages/api/src/modules/order_items/service.ts`** — Agregar campo `item_name TEXT NOT NULL DEFAULT ''` al schema de la tabla `order_items`.

2. **`packages/shared/src/types.ts`** — Agregar `item_name?: string` al tipo `OrderItem`:
   ```typescript
   export type OrderItem = {
     id?: number;
     order_id: number;
     item_id: number;
     item_name?: string;
     quantity: number;
     unit_price: number;
     device_reference?: string;
   };
   ```

### API (prompt del asistente)

3. **`packages/api/src/prompts.ts`** — Actualizar la descripción de `order_items` para incluir `item_name`. En las instrucciones de creación de orden, indicar que al hacer INSERT en `order_items` se debe incluir `item_name` con el nombre del item consultado previamente. Ejemplo:

   ```sql
   INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, device_reference)
   VALUES (1, 5, 'Skin Fibra de Carbono', 1, 25000, 'Samsung Galaxy S24 Ultra');
   ```

4. **`packages/api/src/modules/order_items/controller.ts`** — Agregar `'item_name'` al array de `fieldNames` del constructor para que el CRUD permita recibir y guardar el campo.

### UI (Web)

5. **`packages/web/src/modules/order_items/Page.tsx`** — Agregar columna `item_name` a la tabla:

   ```typescript
   columns={[
     { key: "id", header: "ID" },
     { key: "order_id", header: "Order ID" },
     { key: "item_id", header: "Item ID" },
     { key: "item_name", header: "Item" },
     { key: "quantity", header: "Quantity" },
     { key: "unit_price", header: "Unit Price" },
   ]}
   ```

6. **`packages/web/src/modules/order_items/Form.tsx`** — Agregar campo `item_name` al formulario (tipo texto, opcional — el asistente lo llena automáticamente, pero el admin puede editarlo manualmente):
   ```typescript
   {
     name: "item_name",
     label: "Nombre del artículo",
     type: "text",
     placeholder: "Nombre del item al momento de la orden",
   },
   ```

### Notas

- El campo se llama `item_name` (no `name`) para evitar confusión con otros campos y dejar claro que es una copia del nombre del item.
- El `DEFAULT ''` permite que order_items existentes (creados antes de este cambio) no se rompan.
- El asistente AI ya consulta los items antes de crear la orden (para verificar stock/precio), así que tiene acceso al `name` y solo debe incluirlo en el INSERT.
- Requiere `bun db:reset` para recrear la tabla con el nuevo campo.

---

## Tarea 9: Fundas Transparentes deben ser específicas por modelo (como Fundas 3D)

**Problema:** Actualmente, "Funda Transparente TPU" es un solo item genérico (sin `brand`/`reference`, precio $15,000). El sistema trata las fundas transparentes igual que los skins: producto genérico donde el modelo del celular se guarda en `device_reference` de `order_items`. Sin embargo, las fundas transparentes **sí son específicas por modelo** (cada molde es diferente) y deben tener items individuales por marca/referencia, igual que las Fundas 3D.

**Modelo correcto:**

- **Skins (texturizado/impreso):** genéricos, sin brand/reference. El celular se guarda en `device_reference` de `order_items`.
- **Fundas Transparentes:** específicas por modelo. Cada item tiene `brand` y `reference`. Al ordenar, se verifica disponibilidad por modelo en `items`.
- **Fundas 3D:** específicas por modelo (ya funciona así).

**Cambios:**

1. **`packages/api/scripts/seed.ts`** — Reemplazar el item genérico "Funda Transparente TPU" por items específicos por modelo, todos con `price: 20000`. Usar las mismas combinaciones de brand/reference que ya existen en Fundas 3D:
   - Xiaomi: Poco X6 Pro, Redmi Note 13 Pro, Redmi Note 14 Pro, Poco X7 Pro
   - Apple: iPhone 16, iPhone 16 Pro, iPhone 16 Pro Max, iPhone 15, iPhone 15 Pro Max, iPhone 14, iPhone 13
   - Samsung: Galaxy S25 Ultra, Galaxy S25, Galaxy S24 Ultra, Galaxy S24, Galaxy A55, Galaxy A35, Galaxy A15
   - Motorola: Moto G84, Moto G54
   - Huawei: Nova 12i
   - Cada item: `name: "Funda Transparente TPU"`, `description: "Funda transparente de silicona flexible (TPU) ultraligera de 2mm para {brand} {reference}"`, `type: "funda transparente"`, `brand: "{brand}"`, `reference: "{reference}"`, `price: 20000`, `stock: 50`.

2. **`packages/api/src/prompts.ts`** — Actualizar la línea que trata fundas transparentes como genéricas:
   - Cambiar `-- Funda Transparente: incluir device_reference igual que los skins (es producto genérico)` por algo que indique que fundas transparentes son específicas por modelo, igual que fundas 3D. Buscar por tipo, brand y reference en `items`.

3. **Contexto `flujo_creacion_orden`** en `seed.ts` — Actualizar las menciones de "fundas transparentes" para que ya no se traten como genéricas:
   - **PASO 2:** Cambiar `"Para skins y fundas transparentes: busca por tipo y nombre/diseño (NO por brand/reference, ya que son productos genéricos)"` → `"Para skins: busca por tipo y nombre/diseño (NO por brand/reference, ya que son productos genéricos)"` y agregar `"Para fundas transparentes y fundas 3D: busca por tipo, brand y reference (son específicas por modelo)"`.
   - **PASO 3:** Cambiar `"Para SKINS y FUNDAS TRANSPARENTES: el celular indicado se guardará en el campo 'device_reference'"` → `"Para SKINS: el celular indicado se guardará en el campo 'device_reference'"`. Agregar `"Para FUNDAS TRANSPARENTES: consulta la tabla 'items' filtrando por tipo, marca y referencia para verificar disponibilidad (igual que fundas 3D)"`.
   - **PASO 3:** Cambiar `"Si NO hay stock o no existe el producto para ese celular (solo aplica a fundas 3D)"` → `"Si NO hay stock o no existe el producto para ese celular (aplica a fundas transparentes y fundas 3D)"`.
   - **PASO 8:** Cambiar `"Si el item es un skin o funda transparente, incluye device_reference"` → `"Si el item es un skin, incluye device_reference"`. Y `"Si es funda 3D, deja device_reference vacío"` → `"Si es funda transparente o funda 3D, deja device_reference vacío"`.

4. **`packages/web/src/modules/items/Form.tsx`** — Si hay lógica condicional que muestra brand/reference solo para `type === 'funda 3d'`, extender la condición a `type === 'funda 3d' || type === 'funda transparente'`.

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

---

## Tarea 14: No revelar cantidades exactas de stock al cliente

**Problema:** Cuando el asistente consulta la tabla `items` para verificar disponibilidad, incluye el número exacto de unidades en stock en su respuesta al cliente. Por ejemplo: *"Precio: $20,000 COP. Stock disponible: 50 unidades."* Esto es información interna del negocio que no debe exponerse al cliente. El cliente solo necesita saber si el producto **está disponible o no**, no cuántas unidades hay en inventario.

**Comportamiento actual (incorrecto):**

> Tenemos disponible la funda transparente TPU para iPhone 14. Precio: $20,000 COP. Stock disponible: 50 unidades.

**Comportamiento esperado:**

> Tenemos disponible la funda transparente TPU para iPhone 14. Precio: $20,000 COP.

**Regla:** El asistente debe consultar el campo `stock` internamente para verificar si hay disponibilidad (`stock > 0`), pero **NUNCA** debe mencionar la cantidad exacta de stock en su respuesta al cliente. Solo debe indicar:
- Si hay stock: que el producto está disponible.
- Si no hay stock (`stock = 0`): que el producto no está disponible y sugerir alternativas.

**Cambios:**

1. **`packages/api/src/prompts.ts`** — Agregar una regla explícita en la sección de INSTRUCCIONES:
   - `"NUNCA reveles al cliente la cantidad exacta de stock/inventario de un producto. El stock es información interna. Solo indica si el producto está disponible o no disponible. Usa el campo stock internamente para verificar disponibilidad (stock > 0), pero no menciones números de inventario en tu respuesta."`

2. **`packages/api/scripts/seed.ts`** — En el contexto `flujo_creacion_orden`, reforzar la regla en los pasos donde se verifica stock:
   - **PASO 3:** Cambiar `"Si NO hay stock o no existe el producto para ese celular"` para incluir nota: `"Si NO hay stock o no existe el producto para ese celular, infórmale amablemente que no está disponible y sugiere alternativas. NUNCA le digas al cliente cuántas unidades hay en stock — solo confirma disponibilidad o no disponibilidad."`
   - **NOTAS IMPORTANTES:** Agregar `"- NUNCA incluyas cantidades de stock en tus respuestas al cliente. El inventario es información interna del negocio."`

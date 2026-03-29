# Tareas pendientes

## Tarea 8: `{{userId}}` solo se reemplaza una vez en el prompt

**Problema:** En `assistantController.ts`, `buildPrompt()` usa `.replace('{{userId}}', ...)` que solo reemplaza la **primera** ocurrencia. El template `prompts.ts` usa `{{userId}}` múltiples veces (reglas de aislamiento, WHERE clauses, ejemplo de creación de orden). Las ocurrencias posteriores a la primera quedan sin resolver, rompiendo el aislamiento de datos del usuario.

**Cambios:**

1. **`packages/api/src/controllers/assistantController.ts`** — Cambiar `.replace('{{userId}}', ...)` por `.replaceAll('{{userId}}', ...)` (o usar regex global). Aplicar lo mismo a cualquier otro placeholder que pudiera repetirse.

---

## Tarea 7: Contexto de skins texturizados menciona acabados sin item

**Problema:** El contexto `productos_skins_texturizados` menciona acabados: _"Fibra de Carbono, Cuero, Panal de Abeja (Honey Comb), Madera y efectos Mate o Metálicos"_. Pero los items reales solo incluyen: Fibra de Carbono, Cuero Negro y Madera Natural. Faltan: **Panal de Abeja**, **Mate** y **Metálicos**. Si un cliente pide alguno de estos, el AI lo ofrecerá pero no podrá crear la orden.

**Decisión necesaria:** ¿Se venden esos acabados?

- **Si sí:** Agregar items al seed: Skin Panal de Abeja, Skin Mate, Skin Metálico.
- **Si no:** Quitar las menciones del contexto `productos_skins_texturizados`.

---

## Tarea 11: El asistente no responde con el mensaje de bienvenida al saludar

**Problema:** Cuando un usuario escribe "hola" (u otro saludo) por Telegram, el asistente genera una respuesta genérica en lugar de usar el contenido del contexto `mensaje_bienvenida` que está en la tabla `context`. Aunque `mensaje_bienvenida` tiene `always_inject: true` y se inyecta correctamente en el prompt como contexto de fondo, no hay ninguna instrucción que le diga al modelo que debe **usarlo como respuesta** cuando el usuario saluda o es su primera interacción.

**Causa raíz:** En `prompts.ts`, el contexto `mensaje_bienvenida` se inyecta al inicio del prompt como información de referencia (`[mensaje_bienvenida]: ...`), pero la sección INSTRUCCIONES no indica al modelo qué hacer con él. El modelo lo interpreta como contexto informativo, no como un texto que debe reproducir al recibir un saludo.

**Flujo actual:**

1. Usuario envía "hola" desde Telegram.
2. `assistantController.ts` → `buildPrompt()` inyecta el contexto `mensaje_bienvenida` junto con los demás contextos `always_inject`.
3. El historial de conversación está vacío (`"No hay conversación previa."`).
4. El modelo genera una respuesta libre, ignorando el contenido de `mensaje_bienvenida`.

**Cambios:**

1. **`packages/api/src/prompts.ts`** — Agregar una instrucción explícita en la sección INSTRUCCIONES:

   > "Cuando el usuario envíe un saludo (hola, hi, buenos días, buenas tardes, etc.) y no haya conversación previa, responde usando el contenido del contexto [mensaje_bienvenida] como base de tu respuesta. No lo parafrasees ni lo recortes — úsalo tal cual como mensaje de bienvenida."

   Esto le indica al modelo que ese contexto no es solo informativo, sino que debe usarse como respuesta en el escenario de saludo inicial.

**Notas:**

- La detección del saludo la hace el propio modelo (no requiere lógica en código). La instrucción en el prompt es suficiente para guiar el comportamiento.
- La condición "no hay conversación previa" evita que el modelo repita el mensaje de bienvenida en cada saludo dentro de una conversación ya iniciada.
- No se necesitan cambios en `assistantController.ts`, `seed.ts`, ni en la lógica de inyección de contextos — el mecanismo de `always_inject` ya funciona correctamente.

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

# Tareas completadas

## ~~Tarea 1: Optimizar prompt — eliminar frases de relleno y ajustar temperatura~~ ✅ DONE

**Problema:** El asistente genera respuestas con expresiones innecesarias como "¡Perfecto Dario!", "Excelente elección", "¡Claro que sí!" que alargan el texto sin agregar valor.

**Cambios:**

1. **`packages/api/src/prompts.ts`** — Agregar en la sección INSTRUCCIONES una regla:

   > "No uses expresiones de confirmación, halagos ni frases de relleno como '¡Perfecto!', '¡Excelente elección!', '¡Claro que sí!', '¡Con mucho gusto!'. Ve directo al punto. Sé conciso y eficiente."

2. **`packages/api/src/services/aiService.ts`** — Agregar `temperature` al llamado de `generateText()`. Valor recomendado: `0.4` (balance entre natural y conciso). Hacerlo configurable via constructor/env.

---

## ~~Tarea 3: Recolectar info del usuario progresivamente via campo en orders~~ ✅ DONE

**Problema:** El asistente (`wpbot_assistant`) no puede escribir en `users`, pero durante la conversación recolecta nombre, teléfono y dirección del usuario que deben persistir.

**Diseño elegido:** Campo `collected_info JSONB` en la tabla `orders`.

**Datos a recolectar:** nombre, teléfono, dirección. Si se pierde sin crear orden, es aceptable.

**Cambios:**

1. **`packages/api/src/modules/orders/service.ts`** — Agregar campo `collected_info JSONB DEFAULT '{}'` al schema de la tabla `orders`.

2. **Tipo `Order`** (`packages/shared/src/types.ts`) — Agregar `collected_info?: Record<string, string>` al tipo.

3. **`packages/api/src/prompts.ts`** — Agregar instrucciones al prompt:

   > "Cuando el usuario proporcione información personal (nombre, teléfono, dirección), guárdala en el campo `collected_info` de su orden pendiente usando UPDATE orders SET collected_info = jsonb_set(collected_info, ...). Si aún no hay orden, recuerda la información para incluirla al crear la orden."

4. **`packages/api/scripts/seed.ts`** — Agregar `collected_info` al schema de la tabla orders en el seed.

5. **El flujo de aprobación humana ya existe** — al aprobar la orden, debe leer `collected_info` y actualizar la tabla `users`. (No hay que crear este flujo).

---

## ~~Tarea 4: Skins son genéricos — quitar brand/reference de items para skins~~ ✅ DONE

**Problema:** Los skins (texturizados e impresos) son productos genéricos: el stock sirve para cualquier celular. Solo se necesita la referencia del celular al momento de fabricar (al crear la orden). Actualmente, cada item de skin tiene `brand` y `reference` fijos (ej. "Samsung" + "Galaxy S24 Ultra"), lo cual es incorrecto — un "Skin Fibra de Carbono" debería poder venderse para cualquier celular.

Las **fundas 3D sí son específicas** por modelo y deben mantener `brand` y `reference`.

**Modelo conceptual:**

- **Skins (texturizado/impreso):** catálogo sin brand/reference. Al ordenar, el usuario indica su celular y eso se guarda en `order_items`.
- **Fundas 3D:** catálogo con brand/reference (son específicas por modelo).

**Cambios:**

1. **Tipo `Item`** (`packages/shared/src/types.ts`) — Hacer `brand` y `reference` opcionales:

   ```typescript
   brand?: string;
   reference?: string;
   ```

2. **`packages/api/src/modules/items/service.ts`** — Los campos `brand` y `reference` ya tienen `DEFAULT ''`, no requieren cambio en schema.

3. **`packages/api/src/modules/items/controller.ts`** — Los campos siguen en el array de fieldNames (se mantienen para fundas 3D).

4. **`packages/web/src/modules/items/Form.tsx`** — Hacer `brand` y `reference` condicionales: solo mostrarlos/requerirlos cuando `type === 'funda 3d'`. Para skins, ocultarlos o mostrarlos como opcionales.

5. **`packages/api/scripts/seed.ts`** — Quitar `brand` y `reference` de los items de tipo skin. Mantenerlos solo en fundas 3D.

6. **Nuevo campo en `order_items`**: Agregar `device_reference TEXT DEFAULT ''` a la tabla `order_items` para guardar la referencia del celular que el usuario proporciona al ordenar un skin.
   - En `packages/api/src/modules/order_items/service.ts` — agregar campo.
   - En tipo `OrderItem` (`packages/shared/src/types.ts`) — agregar `device_reference?: string`.

7. **`packages/api/src/prompts.ts`** — Agregar instrucciones:

   > "Los skins (texturizados e impresos) son productos genéricos que sirven para cualquier celular. Al agregar un skin a una orden, SIEMPRE pregunta al usuario la marca y modelo de su celular y guárdalo en el campo `device_reference` de `order_items`. Las fundas 3D son específicas por modelo — verifica que el item tenga la referencia correcta."

8. **Contexto seed** (`flujo_creacion_orden` y otros) — Actualizar para reflejar que skins no se filtran por brand/reference sino por tipo/diseño, y que la referencia del celular se captura al ordenar.

9. **Web**: `packages/web/src/modules/order_items/Form.tsx` — Agregar campo `device_reference` al formulario de order items.

**Preguntas resueltas:**

- Si el usuario no da la referencia de su celular al ordenar un skin, el asistente debe preguntarla antes de crear el order_item.

---

## ~~Tarea 5: Agregar `device_reference` al ejemplo de creación de orden en `prompts.ts`~~ ✅ DONE

**Problema:** En `prompts.ts`, la sección "ESTRUCTURA DE ÓRDENES" lista los campos de `order_items` como `order_id, item_id, quantity, unit_price` pero omite `device_reference`. El ejemplo SQL de creación de orden tampoco lo incluye. Esto puede hacer que el AI ignore `device_reference` aunque el contexto `flujo_creacion_orden` sí lo menciona, generando una contradicción.

**Cambios:**

1. **`packages/api/src/prompts.ts`** — Actualizar la descripción de `order_items` para incluir `device_reference`.
2. **`packages/api/src/prompts.ts`** — Actualizar el ejemplo SQL para mostrar un caso con `device_reference` (ej. un skin) y otro sin él (ej. una funda 3D).

---

## ~~Tarea 6: Funda Transparente mencionada en contexto pero sin item en catálogo~~ ✅ DONE

**Problema:** El contexto `productos_fundas_y_carcasas` en el seed dice: _"Contamos con dos tipos de protección externa: 1) La Funda Transparente de silicona flexible (TPU)..."_. Sin embargo, no existe ningún item de tipo "funda transparente" en la tabla `items`. Si un cliente la pide, el AI la ofrecerá pero no encontrará producto para crear la orden.

**Decisión necesaria:** ¿Se vende la funda transparente como producto independiente?

- **Si sí:** Agregar items de funda transparente al seed (genéricos o por modelo).
- **Si no:** Ajustar el contexto para aclarar que es un complemento no vendido por separado o no disponible actualmente.

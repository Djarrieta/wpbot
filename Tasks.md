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

## Tarea 11: Input de búsqueda dinámica para campos de relación (SearchSelect)

**Problema:** En formularios como `OrderItemForm`, se cargan **todos** los registros relacionados con `fetchAll()` y se muestran en un `<select>` estático. Esto no escala: con cientos de items, el dropdown se vuelve inutilizable y el fetch inicial es costoso.

**Solución:** Componente `SearchSelect` reutilizable que busca registros dinámicamente conforme el usuario escribe, usando el endpoint paginado de la API (Tarea 10) con un parámetro de búsqueda.

### Cambios en la API

1. **`packages/api/src/core/pgRepository.ts`** — Agregar soporte de búsqueda textual a `getAllPaginated()`:
   - Aceptar un parámetro opcional `search?: string` y `searchColumns?: string[]`.
   - Si se reciben, agregar condición `WHERE (col1 ILIKE '%search%' OR col2 ILIKE '%search%' ...)` usando parámetros preparados (prevenir SQL injection).
   - Esto permite que el endpoint existente `GET /items?page=1&limit=10&search=camisa` retorne solo los items que coincidan.

2. **`packages/api/src/core/crudController.ts`** — Leer query param `search` y pasarlo a `getAllPaginated()`. Cada módulo define sus columnas buscables en su configuración (por defecto `['name']`).

3. **Configuración por módulo** — Cada servicio/módulo puede declarar `searchColumns` (ej: items → `['name', 'description']`, users → `['name', 'email', 'phone']`). Si no se declara, usar `['name']` como fallback.

### Cambios en la UI (Web)

4. **Nuevo componente `packages/web/src/components/SearchSelect.tsx`**:
   - Props:
     - `apiClient`: cliente API del módulo relacionado (ej: `itemsApi`).
     - `value`: ID del registro seleccionado (controlado).
     - `onChange(id, record)`: callback al seleccionar un registro.
     - `labelKey`: campo a mostrar como texto (default `'name'`).
     - `valueKey`: campo a usar como valor (default `'id'`).
     - `placeholder`: texto del input.
   - Comportamiento:
     - Input de texto con debounce (~300ms).
     - Al escribir, llama a `apiClient.fetchPaginated({ page: 1, limit: 10, search: inputValue })`.
     - Muestra dropdown con los resultados debajo del input.
     - Al seleccionar un resultado, cierra el dropdown, muestra el label seleccionado en el input, y llama `onChange`.
     - Botón para limpiar la selección.
     - Estado de carga (spinner o texto "Buscando...").
     - Si el input está vacío, mostrar los primeros 10 resultados (carga inicial ligera).
   - Estilos: consistentes con el diseño actual (dark mode, bordes grises, etc).

5. **`packages/web/src/lib/createApiClient.ts`** — Asegurar que `fetchPaginated()` acepte un parámetro `search` opcional y lo pase como query param.

6. **`packages/web/src/modules/order_items/Form.tsx`** — Refactorizar:
   - Reemplazar el `<select>` estático de items por `<SearchSelect>`.
   - Eliminar el `useEffect` que hace `fetchAll()` de todos los items.
   - En el `onChange` del `SearchSelect`, seguir auto-poblando `unit_price` con el precio del item seleccionado.

### Notas

- **Depende de Tarea 10** (paginación) para el endpoint `fetchPaginated`.
- El componente `SearchSelect` es genérico y reutilizable para cualquier campo de relación futuro (ej: seleccionar usuario en una orden, seleccionar orden en un envío).
- Usar debounce para no hacer una request por cada keystroke.
- El parámetro `search` usa `ILIKE` (case-insensitive) de PostgreSQL.

---

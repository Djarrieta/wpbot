# Tareas pendientes

## ~~Tarea 1: Optimizar prompt — eliminar frases de relleno y ajustar temperatura~~ ✅ DONE

**Problema:** El asistente genera respuestas con expresiones innecesarias como "¡Perfecto Dario!", "Excelente elección", "¡Claro que sí!" que alargan el texto sin agregar valor.

**Cambios:**

1. **`packages/api/src/prompts.ts`** — Agregar en la sección INSTRUCCIONES una regla:

   > "No uses expresiones de confirmación, halagos ni frases de relleno como '¡Perfecto!', '¡Excelente elección!', '¡Claro que sí!', '¡Con mucho gusto!'. Ve directo al punto. Sé conciso y eficiente."

2. **`packages/api/src/services/aiService.ts`** — Agregar `temperature` al llamado de `generateText()`. Valor recomendado: `0.4` (balance entre natural y conciso). Hacerlo configurable via constructor/env.

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

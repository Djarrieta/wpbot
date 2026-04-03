# Tarea 2: Sistema de resumen (summary) en chat_history

**Problema:** Se inyectan los últimos 20 mensajes completos en cada prompt. Conversaciones largas consumen tokens innecesariamente.

**Diseño elegido:** Registro especial en `chat_history` con `role = 'summary'` que marca el punto de corte.

**Cambios:**

1. **Tipo `ChatHistory`** (`packages/shared/src/types.ts`) — Agregar `'summary'` al tipo `role`:

   ```ts
   role: "user" | "assistant" | "summary";
   ```

2. **`packages/api/src/modules/chathistory/service.ts`**:
   - Modificar `initializeTable()`: el campo `role` ya acepta texto libre (tipo TEXT), no hay restricción de CHECK. No requiere cambio de schema.
   - Modificar `getByUserId(userId)`: agregar filtro `AND role != 'summary'` para que los registros de resumen no se mezclen con el historial normal de conversación.
   - Nuevo método `getLatestSummary(userId)`: obtiene el summary más reciente del usuario (`WHERE user_id = $1 AND role = 'summary' ORDER BY id DESC LIMIT 1`).
   - Nuevo método `getMessagesSinceSummary(userId)`: obtiene mensajes posteriores al último summary (excluyendo summaries). Si no hay summary previo, retorna todos los mensajes.
   - Nuevo método `saveSummary(userId, summaryText)`: guarda un registro con `role='summary'` usando `this.create(...)` directamente (NO usar `addMessage`, ya que su firma está diseñada para `'user' | 'assistant'` y tiene el parámetro `requiresHuman`).
   - Nuevo método `shouldSummarize(userId)`: retorna true si hay más de 30 mensajes sin resumir.

   **Nota:** Los métodos existentes `getLastAssistantMessage()` y `isConversationBlocked()` filtran por `role = 'assistant'`, por lo que no se ven afectados por la adición de registros `role = 'summary'`.

3. **`packages/api/src/controllers/assistantController.ts`**:
   - **Modificar `buildPrompt()`**: Cambiar la lógica que construye el valor de la variable `conversationHistory` (que se inyecta en el placeholder `{{conversationHistory}}` del template en `prompts.ts`). El template NO se modifica.
     - Si existe un summary para el usuario: construir `conversationHistory` como `"RESUMEN DE CONVERSACIÓN ANTERIOR:\n{summary}\n\nCONVERSACIÓN RECIENTE:\n{mensajes_nuevos}"`.
     - Si no hay summary: construir `conversationHistory` con el historial completo (comportamiento actual).
   - **Modificar `handle()`**: Después de generar la respuesta y guardarla, verificar `shouldSummarize(userId)`. Si retorna true, lanzar la generación del summary **en background (fire-and-forget)** para no bloquear la respuesta al usuario:
     ```ts
     this.generateSummary(userId).catch((err) =>
       console.error("Summary generation failed:", err),
     );
     ```
   - **Nuevo método privado `generateSummary(userId)`**: Obtiene los mensajes sin resumir, construye un prompt de resumen, llama al LLM vía `this.responseGenerator.generateResponse(promptResumen)`, y guarda el resultado con `saveSummary()`. Se reutiliza el mismo `responseGenerator` existente — aunque tiene tool-calling habilitado, el prompt de resumen no invocará tools porque es una instrucción de texto puro.

4. **Umbral:** 30 mensajes sin resumir disparan la generación automática del summary.

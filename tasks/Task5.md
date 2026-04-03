# Tarea 5: Mejorar naturalidad del bot y documentar arquitectura prompt vs context

## Problema

El bot genera frases robóticas que delatan que es una IA, como "Veo que necesitas una funda para tu celular" — que es básicamente parafrasear lo que el usuario acaba de decir. Una persona real no respondería así.

## Análisis

La arquitectura tiene dos capas:
- **Prompt** (`packages/api/src/prompts.ts`): Instrucciones técnicas/comportamentales mantenidas por devs. Define permisos SQL, reglas de respuesta, formato, etc.
- **Context** (tabla `context`, seed en `packages/api/scripts/seed.ts`): Contenido de negocio editable por el admin desde el dashboard web. Incluye mensaje de bienvenida, info de productos, flujo de pedidos, etc.

El fix va en el **prompt** porque es una instrucción de comportamiento (CÓMO responder), no contenido de negocio (QUÉ decir).

## Cambios

### 1. Prompt (`packages/api/src/prompts.ts`)

Agregar en la sección INSTRUCCIONES una regla de naturalidad conversacional:

- **No parafrasear** lo que el usuario acaba de decir. Si el usuario dice "necesito una funda", NO responder "Veo que necesitas una funda". Ir directo a la acción: preguntar modelo, mostrar opciones, etc.
- **Sonar como un vendedor humano** en WhatsApp: respuestas directas, casuales, sin estructura robótica. Evitar frases formulaicas tipo "Entiendo que...", "Veo que...", "Comprendo tu solicitud de...".
- **Nunca enumerar opciones de forma mecánica** si no se pidió un listado. Si el usuario pide algo específico, responder sobre eso directamente.

### 2. README (`README.md`)

Agregar una sección que documente la arquitectura de prompts:

- **Prompt** (`prompts.ts`): Instrucciones técnicas — permisos, reglas de comportamiento, formato. Mantenido por desarrolladores.
- **Context** (tabla `context`): Contenido de negocio — bienvenida, info de empresa, catálogo, flujo de pedidos. Editable por el admin desde el dashboard web en la sección "Contexto".
- Explicar que los contextos marcados `always_inject=true` se inyectan siempre, y los `always_inject=false` se consultan bajo demanda.

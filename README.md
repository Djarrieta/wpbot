# wpbot

A monorepo with an AI assistant API, a web dashboard, and messaging bots for WhatsApp and Telegram. The API uses the Vercel AI SDK with tool-calling to interact with a PostgreSQL database. The messaging packages forward user messages to the API and relay responses back.

## Folder Structure

```text
wpbot/
├── packages/
│   ├── api/          # Core backend API and MCP LLM logic
│   ├── shared/       # Shared types and utilities
│   ├── telegram/     # Telegram bot package
│   ├── web/          # React frontend dashboard
│   └── whatsapp/     # WhatsApp webhook bot package
├── pgdata/           # PostgreSQL data (Podman volume)
├── scripts/
│   └── reset-db.sh   # Utility script to reset database
├── tasks/            # Task documentation
├── .env.example      # Example environment variables
├── Tasks.md          # Task list
├── package.json      # Monorepo configuration
└── README.md
```

## Packages

| Package           | Port | Description                                                       |
| ----------------- | ---- | ----------------------------------------------------------------- |
| `@wpbot/api`      | 4000 | Core assistant API (`POST /assistant`), items CRUD, Vercel AI SDK |
| `@wpbot/web`      | 4001 | Next.js dashboard for managing data                               |
| `@wpbot/whatsapp` | 4002 | WhatsApp bot (webhook-based)                                      |
| `@wpbot/telegram` | —    | Telegram bot (Telegraf, long polling)                             |

## Setup

```bash
bun install
cp .env.example .env
# Fill in your API keys and tokens in .env
```

## Database (Podman)

Reset the database (stops/removes the container, recreates it, runs SQL setup and seed):

```bash
bun run db:reset
```

Stop/start the container:

```bash
podman stop wpbot-db
podman start wpbot-db
```

Connect manually:

````bash
podman exec -it wpbot-db psql -U wpbot -d wpbot

## Environment Variables

Configured in the root `.env` (symlinked into each package):

| Variable                   | Description                         |
| -------------------------- | ----------------------------------- |
| `PORT`                     | API server port (default: 4000)     |
| `WEB_PORT`                 | Web dev server port (default: 4001) |
| `WHATSAPP_PORT`            | WhatsApp bot port (default: 4002)   |
| `WHATSAPP_ACCESS_TOKEN`    | Meta WhatsApp Cloud API token       |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID            |
| `WHATSAPP_BASE_URL`        | WhatsApp API base URL               |
| `WHATSAPP_API_VERSION`     | WhatsApp API version (e.g. v22.0)   |
| `WHATSAPP_VERIFY_TOKEN`    | Webhook verification token          |
| `TELEGRAM_BOT_TOKEN`       | Telegram bot token from BotFather   |
| `LLM_API_KEY`              | LLM API key (OpenAI, DeepSeek, etc) |
| `LLM_MODEL`                | LLM model name (e.g. deepseek-chat) |
| `LLM_BASE_URL`             | OpenAI-compatible API base URL      |
| `AI_MAX_STEPS`             | Max AI tool-calling steps (default: 8) |

## Running

```bash
# All packages
bun run dev

# API + Web + Telegram
bun run dev:telegram

# API + Web + WhatsApp
bun run dev:whatsapp

# Reset database
bun run db:reset
```

## API Endpoints

- `GET /` — Health check
- `POST /assistant` — Send `{ "message": "..." }`, get `{ "response": "..." }`
- `GET /items` — List all items
- `POST /items` — Create item `{ "name": "...", "quantity": 0 }`
- `GET /items/:id` — Get item by ID
- `PUT /items/:id` — Update item
- `DELETE /items/:id` — Delete item

## Arquitectura de Prompts

El comportamiento del asistente se configura en dos capas complementarias:

### Prompt (`packages/api/src/prompts.ts`)

Instrucciones técnicas y de comportamiento mantenidas por desarrolladores:

- Permisos SQL (qué tablas puede leer/escribir)
- Reglas de respuesta (formato, tono, naturalidad)
- Aislamiento de datos por usuario
- Modelo de datos y ejemplos de queries

Cualquier cambio sobre **cómo** responde el bot (comportamiento, estilo, restricciones) va aquí.

### Context (tabla `context`, editable desde el dashboard web)

Contenido de negocio editable por el admin desde la sección "Contexto" del dashboard:

- Mensaje de bienvenida
- Información de la empresa y productos
- Flujo de pedidos, métodos de pago, envíos
- Preguntas frecuentes

Cualquier cambio sobre **qué** dice el bot (contenido de negocio) va aquí.

Los contextos con `always_inject = true` se inyectan siempre en el prompt. Los de `always_inject = false` se consultan bajo demanda cuando la pregunta del usuario se relaciona con ese tema.

## Adding a New Module

To add a CRUD module (e.g. `context` or `items`), create/update the following files:

### 1. Shared — `packages/shared/src/`

- **`types.ts`** — Add the type (e.g. `export type Context = { id?: number; topic: string; content: string };`)
- **`index.ts`** — Export it

### 2. API — `packages/api/src/modules/<name>/`

| File            | Purpose                                                               |
| --------------- | --------------------------------------------------------------------- |
| `service.ts`    | `PgRepository` with column definitions                                |
| `controller.ts` | Extends `GenericCrudController`, sets required fields                 |
| `index.ts`      | Calls `initializeTable()`, exports default `{ basePath, controller }` |

Then register in **`modules/index.ts`**: import, add to the array, and call `init()`.

If seed data is needed, add it to **`scripts/seed.ts`** (create table + insert rows).

### 3. Web — `packages/web/src/modules/<name>/`

| File       | Purpose                                                            |
| ---------- | ------------------------------------------------------------------ |
| `api.ts`   | `createApiClient<WithId<Type>>("/path", "name")`                   |
| `Form.tsx` | Uses `GenericForm` with field definitions                          |
| `Page.tsx` | Uses `CrudPage` with column config + `FormComponent`               |
| `index.ts` | Exports `{ basePath, label, icon, Page }` satisfies `ModuleConfig` |

Then register in **`modules/index.ts`**: import and add to the array.

### 4. Next.js Route — `packages/web/src/app/<name>/page.tsx`

Create a page file that renders the module's Page component:

```tsx
"use client";

import { ExamplePage } from "@/modules/<name>/Page";

export default function ExampleRoute() {
  return <ExamplePage />;
}

```
````

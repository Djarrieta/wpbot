# wpbot

A monorepo with an AI assistant API, a web dashboard, and messaging bots for WhatsApp and Telegram. The API uses MCP + LLM to generate responses backed by a PostgreSQL database. The messaging packages forward user messages to the API and relay responses back.

## Folder Structure

```text
wpbot/
├── packages/
│   ├── api/          # Core backend API and MCP LLM logic
│   ├── shared/       # Shared types and utilities
│   ├── telegram/     # Telegram bot package
│   ├── web/          # React frontend dashboard
│   └── whatsapp/     # WhatsApp webhook bot package
├── scripts/
│   └── reset-db.sh   # Utility script to reset database
├── .env.example      # Example environment variables
├── package.json      # Monorepo configuration
└── README.md
```

## Packages

| Package           | Port | Description                                                   |
| ----------------- | ---- | ------------------------------------------------------------- |
| `@wpbot/api`      | 4000 | Core assistant API (`POST /assistant`), items CRUD, MCP + LLM |
| `@wpbot/web`      | 4001 | React dashboard for managing items                            |
| `@wpbot/whatsapp` | 4002 | WhatsApp bot (webhook-based)                                  |
| `@wpbot/telegram` | —    | Telegram bot (Telegraf, long polling)                         |

## Setup

```bash
bun install
cp .env.example .env
# Fill in your API keys and tokens in .env
```

## Database (Podman)

Run PostgreSQL with Podman:

```bash
sudo podman stop wpbot-db
sudo podman rm wpbot-db
sudo rm -rf ./pgdata
mkdir -p ./pgdata
sudo podman run -d \
  --name wpbot-db \
  -e POSTGRES_USER=wpbot \
  -e POSTGRES_PASSWORD=wpbot \
  -e POSTGRES_DB=wpbot \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 4003:5432 \
  -v ./pgdata:/var/lib/postgresql/data \
  docker.io/library/postgres:17

  sudo podman exec -i wpbot-db psql -U wpbot -d wpbot < packages/api/scripts/setup-db-users.sql
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
| `DEEPSEEK_API_KEY`         | DeepSeek / LLM API key              |
| `DEEPSEEK_MODEL`           | LLM model name                      |
| `DEEPSEEK_BASE_URL`        | Custom OpenAI-compatible base URL   |
| `MCP_MAX_STEPS`            | Max MCP agent steps (default: 8)    |

## Running

```bash
# All packages
bun run dev

# Individual packages
bun run dev:api
bun run dev:web
bun run dev:whatsapp
bun run dev:telegram

# API + Web + Telegram (no WhatsApp)
bun run dev:no-whatsapp
````

## API Endpoints

- `GET /` — Health check
- `POST /assistant` — Send `{ "message": "..." }`, get `{ "response": "..." }`
- `GET /items` — List all items
- `POST /items` — Create item `{ "name": "...", "quantity": 0 }`
- `GET /items/:id` — Get item by ID
- `PUT /items/:id` — Update item
- `DELETE /items/:id` — Delete item

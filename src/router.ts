import { WebhookController } from "./controllers/webhookController";
import { HealthController } from "./controllers/healthController";
import { ItemsController } from "./controllers/itemsController";
import { WhatsAppService } from "./services/whatsappService";
import { TelegramService } from "./services/telegramService";
import { MCPService } from "./services/mcpService";
import { DeepSeekLLMProvider } from "./services/llmProvider";
import { ItemsSQLite } from "./services/itemsSQLite";
import { MCP_CONFIG_PATH } from "./constants";
import type { Route } from "./core/types";

const whatsappService = new WhatsAppService(
  Bun.env.WHATSAPP_ACCESS_TOKEN!,
  Bun.env.WHATSAPP_PHONE_NUMBER_ID!,
  Bun.env.WHATSAPP_BASE_URL!,
  Bun.env.WHATSAPP_API_VERSION!,
  Bun.env.WHATSAPP_VERIFY_TOKEN
);
const telegramService = new TelegramService(
  Bun.env.TELEGRAM_BOT_TOKEN!,
  Bun.env.TELEGRAM_BASE_URL
);
const llmProvider = new DeepSeekLLMProvider(
  Bun.env.DEEPSEEK_API_KEY!,
  Bun.env.DEEPSEEK_MODEL!,
  Bun.env.DEEPSEEK_BASE_URL
);
const mcpService = new MCPService(
  llmProvider,
  MCP_CONFIG_PATH,
  Number(Bun.env.MCP_MAX_STEPS) || 8
);

// Pass mcpService as responseGenerator to enable LLM-powered responses
const whatsappWebhook = new WebhookController(whatsappService, mcpService);
const telegramWebhook = new WebhookController(telegramService, mcpService);
const health = new HealthController();
const itemsService = new ItemsSQLite();
const items = new ItemsController(itemsService);

const routes: Route[] = [
  { method: "GET", pathname: "/webhook", handler: (req) => whatsappWebhook.handleVerification(req) },
  { method: "POST", pathname: "/webhook", handler: (req) => whatsappWebhook.handleEvent(req) },
  { method: "POST", pathname: "/telegram", handler: (req) => telegramWebhook.handleEvent(req) },
  { method: "GET", pathname: "/", handler: (req) => health.handle(req) },
  { method: "GET", pathname: "/items", handler: (req) => items.getAll(req) },
  { method: "POST", pathname: "/items", handler: (req) => items.create(req) },
];

export function router(req: Request): Response | Promise<Response> {
  const { pathname } = new URL(req.url);

  // Handle /items/:id routes
  const itemsMatch = pathname.match(/^\/items\/(\d+)$/);
  if (itemsMatch) {
    const id = parseInt(itemsMatch[1]!, 10);
    if (req.method === "GET") return items.getById(req, id);
    if (req.method === "PUT") return items.update(req, id);
    if (req.method === "DELETE") return items.delete(req, id);
  }

  const route = routes.find(
    (r) => r.method === req.method && r.pathname === pathname
  );

  if (route) return route.handler(req);

  return new Response("Not Found", { status: 404 });
}

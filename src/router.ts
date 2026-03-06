import { WebhookController } from "./controllers/webhookController";
import { HealthController } from "./controllers/healthController";
import { ItemsController } from "./controllers/itemsController";
import { WhatsAppService } from "./services/whatsappService";
import { TelegramService } from "./services/telegramService";
import { MCPService } from "./services/mcpService";
import { DeepSeekLLMProvider } from "./services/llmProvider";
import { ItemsSQLite } from "./services/itemsSQLite";
import { MCP_CONFIG_PATH } from "./constants";
import type { Route, ResourceRoute } from "./core/types";

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

const health = new HealthController();
const itemsService = new ItemsSQLite();
const items = new ItemsController(itemsService);

const whatsappWebhook = new WebhookController(whatsappService, mcpService, items);
const telegramWebhook = new WebhookController(telegramService, mcpService, items);

const routes: Route[] = [
  { method: "GET", pathname: "/webhook", handler: (req) => whatsappWebhook.handleVerification(req) },
  { method: "POST", pathname: "/webhook", handler: (req) => whatsappWebhook.handleEvent(req) },
  { method: "POST", pathname: "/telegram", handler: (req) => telegramWebhook.handleEvent(req) },
  { method: "GET", pathname: "/", handler: (req) => health.handle(req) },
];

// Register CRUD resources here - add new modules by adding to this array
const resources: ResourceRoute[] = [
  { basePath: "/items", controller: items },
  // Add more resources: { basePath: "/products", controller: products },
];

function handleResourceRoutes(method: string, pathname: string, req: Request): Response | Promise<Response> | null {
  for (const resource of resources) {
    // Match exact basePath for collection routes
    if (pathname === resource.basePath) {
      if (method === "GET") return resource.controller.getAll(req);
      if (method === "POST") return resource.controller.create(req);
    }

    // Match basePath/:id for item routes
    const idMatch = pathname.match(new RegExp(`^${resource.basePath}/(\\d+)$`));
    if (idMatch) {
      const id = parseInt(idMatch[1]!, 10);
      if (method === "GET") return resource.controller.getById(req, id);
      if (method === "PUT") return resource.controller.update(req, id);
      if (method === "DELETE") return resource.controller.delete(req, id);
    }
  }
  return null;
}

export function router(req: Request): Response | Promise<Response> {
  const { pathname } = new URL(req.url);

  // Try resource routes first
  const resourceResponse = handleResourceRoutes(req.method, pathname, req);
  if (resourceResponse) return resourceResponse;

  // Fall back to static routes
  const route = routes.find(
    (r) => r.method === req.method && r.pathname === pathname
  );

  if (route) return route.handler(req);

  return new Response("Not Found", { status: 404 });
}

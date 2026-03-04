import { WebhookController } from "./controllers/webhookController";
import { HealthController } from "./controllers/healthController";
import { WhatsAppService } from "./services/whatsappService";
import { TelegramService } from "./services/telegramService";
import { MCPService } from "./services/mcpService";
import { DeepSeekLLMProvider } from "./services/llmProvider";

type Handler = (req: Request) => Response | Promise<Response>;

interface Route {
  method: string;
  pathname: string;
  handler: Handler;
}

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
  Bun.env.MCP_CONFIG_PATH!,
  Number(Bun.env.MCP_MAX_STEPS) || 8
);

// Pass mcpService as responseGenerator to enable LLM-powered responses
const whatsappWebhook = new WebhookController(whatsappService, mcpService);
const telegramWebhook = new WebhookController(telegramService, mcpService);
const health = new HealthController();

const routes: Route[] = [
  { method: "GET", pathname: "/webhook", handler: (req) => whatsappWebhook.handleVerification(req) },
  { method: "POST", pathname: "/webhook", handler: (req) => whatsappWebhook.handleEvent(req) },
  { method: "POST", pathname: "/telegram", handler: (req) => telegramWebhook.handleEvent(req) },
  { method: "GET", pathname: "/", handler: (req) => health.handle(req) },
];

export function router(req: Request): Response | Promise<Response> {
  const { pathname } = new URL(req.url);

  const route = routes.find(
    (r) => r.method === req.method && r.pathname === pathname
  );

  if (route) return route.handler(req);

  return new Response("Not Found", { status: 404 });
}

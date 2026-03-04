import { WebhookController } from "./controllers/webhookController";
import { HealthController } from "./controllers/healthController";
import { WhatsAppService } from "./services/whatsappService";

type Handler = (req: Request) => Response | Promise<Response>;

interface Route {
  method: string;
  pathname: string;
  handler: Handler;
}

const messagingService = new WhatsAppService(
  Bun.env.WHATSAPP_ACCESS_TOKEN!,
  Bun.env.WHATSAPP_PHONE_NUMBER_ID!,
  Bun.env.WHATSAPP_BASE_URL!,
  Bun.env.WHATSAPP_API_VERSION!
);
const webhook = new WebhookController(messagingService);
const health = new HealthController();

const routes: Route[] = [
  { method: "GET", pathname: "/webhook", handler: (req) => webhook.handleVerification(req) },
  { method: "POST", pathname: "/webhook", handler: (req) => webhook.handleEvent(req) },
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

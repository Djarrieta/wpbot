import { HealthController } from "./controllers/healthController";
import { AssistantController } from "./controllers/assistantController";
import { AIService } from "./services/aiService";
import { modules } from "./modules";
import { service as itemsService } from "./modules/items";
import type { Route } from "./core/types";
import { service as chatHistoryService } from "./modules/chathistory";
import { service as usersService } from "./modules/users";
import { ASSISTANT_PROMPT } from "./prompts";
import { getPool } from "./core/dbPool";
import { requireEnv, optionalEnvNumber } from "@wpbot/shared";
import type { Context } from "@wpbot/shared";

const aiService = new AIService(
  requireEnv("LLM_API_KEY"),
  requireEnv("LLM_MODEL"),
  optionalEnvNumber("AI_MAX_STEPS", 8),
  requireEnv("LLM_BASE_URL"),
);

async function fetchQueryableTopics(): Promise<string[]> {
  const pool = getPool('admin');
  const result = await pool.query('SELECT topic FROM context WHERE always_inject = false ORDER BY topic');
  return result.rows.map((r: { topic: string }) => r.topic);
}

async function fetchAlwaysInjectContexts(): Promise<Context[]> {
  const pool = getPool('admin');
  const result = await pool.query('SELECT id, topic, content, always_inject FROM context WHERE always_inject = true ORDER BY id');
  return result.rows;
}

const health = new HealthController();
const assistant = new AssistantController(
  aiService,
  modules.map((m) => m.controller),
  ASSISTANT_PROMPT,
  chatHistoryService,
  usersService,
  fetchQueryableTopics,
  fetchAlwaysInjectContexts,
);

const routes: Route[] = [
  {
    method: "POST",
    pathname: "/assistant",
    handler: (req) => assistant.handle(req),
  },
  {
    method: "POST",
    pathname: "/users/by-email",
    handler: async (req) => {
      const body = await req.json() as { email?: string; name?: string };
      if (!body.email?.trim()) {
        return Response.json({ error: "email is required" }, { status: 400 });
      }
      const user = await usersService.getOrCreateByEmail(body.email, body.name);
      return Response.json(user);
    },
  },
  { method: "GET", pathname: "/", handler: (req) => health.handle(req) },
  {
    method: "GET",
    pathname: "/api/stats",
    handler: async () => {
      const allItems = await itemsService.getAll();
      const totalItems = allItems.length;
      const totalValue = allItems.reduce((sum, item) => sum + item.price, 0);
      const avgPrice = totalItems > 0 ? totalValue / totalItems : 0;
      return Response.json({ totalItems, totalValue, avgPrice });
    },
  },
];

function handleResourceRoutes(
  method: string,
  pathname: string,
  req: Request,
): Response | Promise<Response> | null {
  for (const resource of modules) {
    if (pathname === resource.basePath) {
      if (method === "GET") return resource.controller.getAll(req);
      if (method === "POST") return resource.controller.create(req);
    }

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

  const resourceResponse = handleResourceRoutes(req.method, pathname, req);
  if (resourceResponse) return resourceResponse;

  const route = routes.find(
    (r) => r.method === req.method && r.pathname === pathname,
  );

  if (route) return route.handler(req);

  return new Response("Not Found", { status: 404 });
}

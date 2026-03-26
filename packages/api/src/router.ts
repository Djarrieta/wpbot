import { HealthController } from "./controllers/healthController";
import { AssistantController } from "./controllers/assistantController";
import { AIService } from "./services/aiService";
import { modules } from "./modules";
import { service as itemsService } from "./modules/items";
import { handleGoogleRedirect, handleGoogleCallback, handleGetSession, handleLogout } from "./auth";
import { optionalEnv } from "@wpbot/shared";
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
    pathname: "/auth/google",
    handler: () => handleGoogleRedirect(),
  },
  {
    method: "GET",
    pathname: "/auth/google/callback",
    handler: (req) => handleGoogleCallback(req),
  },
  {
    method: "GET",
    pathname: "/auth/me",
    handler: (req) => handleGetSession(req),
  },
  {
    method: "POST",
    pathname: "/auth/logout",
    handler: () => handleLogout(),
  },
  {
    method: "GET",
    pathname: "/stats",
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

const WEB_ORIGIN = optionalEnv("WEB_URL", `http://localhost:${Bun.env.WEB_PORT ?? "4001"}`);

function withCors(res: Response, origin: string): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function router(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), WEB_ORIGIN);
  }

  const resourceResponse = handleResourceRoutes(req.method, pathname, req);
  if (resourceResponse) {
    const res = await resourceResponse;
    return withCors(res, WEB_ORIGIN);
  }

  const route = routes.find(
    (r) => r.method === req.method && r.pathname === pathname,
  );

  if (route) {
    const res = await route.handler(req);
    return withCors(res, WEB_ORIGIN);
  }

  return withCors(new Response("Not Found", { status: 404 }), WEB_ORIGIN);
}

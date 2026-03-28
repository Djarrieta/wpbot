import { HealthController } from "./controllers/healthController";
import { AssistantController } from "./controllers/assistantController";
import { AIService } from "./services/aiService";
import { modules } from "./modules";
import { service as itemsService } from "./modules/items";
import { handleGoogleRedirect, handleGoogleCallback, handleGetSession, handleLogout, verifySession } from "./auth";
import { optionalEnv } from "@wpbot/shared";
import type { Route } from "./core/types";
import { service as chatHistoryService } from "./modules/chathistory";
import { service as usersService } from "./modules/users";
import { ASSISTANT_PROMPT } from "./prompts";
import { getPool } from "./core/dbPool";
import { requireEnv, optionalEnvNumber } from "@wpbot/shared";
import type { Context } from "@wpbot/shared";

const WOMPI_PUBLIC_KEY = optionalEnv("WOMPI_PUBLIC_KEY", "");
const WOMPI_INTEGRITY_SECRET = optionalEnv("WOMPI_INTEGRITY_SECRET", "");

const aiService = new AIService(
  requireEnv("LLM_API_KEY"),
  requireEnv("LLM_MODEL"),
  optionalEnvNumber("AI_MAX_STEPS", 8),
  requireEnv("LLM_BASE_URL"),
  optionalEnvNumber("AI_TEMPERATURE", 0.6),
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
  { method: "GET", pathname: "/", handler: (req) => health.handle(req) },
  {
    method: "GET",
    pathname: "/auth/google",
    handler: () => handleGoogleRedirect(),
  },
  {
    method: "GET",
    pathname: "/auth/google/callback",
    handler: (req) => handleGoogleCallback(req, usersService),
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
  {
    method: "POST",
    pathname: "/wompi/checkout",
    handler: async (req) => {
      if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
        return Response.json({ error: "Wompi not configured" }, { status: 503 });
      }
      const body = await req.json() as { itemId?: number };
      if (!body.itemId) {
        return Response.json({ error: "itemId is required" }, { status: 400 });
      }
      const item = await itemsService.getById(body.itemId);
      if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
      }
      const amountInCents = Math.round(item.price * 100);
      const reference = `wpbot-${body.itemId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const concat = `${reference}${amountInCents}COP${WOMPI_INTEGRITY_SECRET}`;
      const encoded = new TextEncoder().encode(concat);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return Response.json({
        publicKey: WOMPI_PUBLIC_KEY,
        reference,
        amountInCents,
        currency: "COP",
        signature: hashHex,
      });
    },
  },
  {
    method: "POST",
    pathname: "/users/merge",
    handler: async (req) => {
      const adminError = await requireAdmin(req);
      if (adminError) return adminError;
      const body = await req.json() as { targetId?: number; sourceId?: number };
      if (!body.targetId || !body.sourceId) {
        return Response.json({ error: "targetId and sourceId are required" }, { status: 400 });
      }
      try {
        const merged = await usersService.mergeUsers(body.targetId, body.sourceId);
        return Response.json(merged);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Merge failed";
        return Response.json({ error: message }, { status: 400 });
      }
    },
  },
];

const COOKIE_NAME = "wpbot_session";

async function requireAdmin(req: Request): Promise<Response | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  }
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const payload = await verifySession(token);
  if (!payload || payload.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  return null; // authorized
}

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

  // Resource routes — public read for /items, admin required for everything else
  const resourceResponse = handleResourceRoutes(req.method, pathname, req);
  if (resourceResponse) {
    const isPublicRead = req.method === "GET" && (pathname === "/items" || /^\/items\/\d+$/.test(pathname));
    if (!isPublicRead) {
      const adminError = await requireAdmin(req);
      if (adminError) return withCors(adminError, WEB_ORIGIN);
    }
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

import { HealthController } from "./controllers/healthController";
import { AssistantController } from "./controllers/assistantController";
import { MCPService } from "./services/mcpService";
import { DeepSeekLLMProvider } from "./services/llmProvider";
import { MCP_ASSISTANT_CONFIG } from "./constants";
import { modules } from "./modules";
import { service as itemsService } from "./modules/items";
import type { Route } from "./core/types";
import { service as chatHistoryService } from "./modules/chathistory";
import { service as usersService } from "./modules/users";
import { ASSISTANT_PROMPT } from "./prompts";
import { getPool } from "./core/dbPool";

const llmProvider = new DeepSeekLLMProvider(
  Bun.env.DEEPSEEK_API_KEY!,
  Bun.env.DEEPSEEK_MODEL!,
  Bun.env.DEEPSEEK_BASE_URL,
);
// Use assistant config - can SELECT all tables, INSERT/UPDATE orders
const mcpService = new MCPService(
  llmProvider,
  MCP_ASSISTANT_CONFIG,
  Number(Bun.env.MCP_MAX_STEPS) || 8,
);

async function fetchContextTopics(): Promise<string[]> {
  const pool = getPool('admin');
  const result = await pool.query('SELECT topic FROM context ORDER BY topic');
  return result.rows.map((r: { topic: string }) => r.topic);
}

const health = new HealthController();
const assistant = new AssistantController(
  mcpService,
  modules.map((m) => m.controller),
  ASSISTANT_PROMPT,
  chatHistoryService,
  usersService,
  fetchContextTopics,
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

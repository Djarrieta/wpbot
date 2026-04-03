import { HealthController } from "./controllers/healthController";
import { AssistantController } from "./controllers/assistantController";
import { AIService } from "./services/aiService";
import { modules } from "./modules";
import { service as productsService } from "./modules/products";
import { service as itemsService } from "./modules/items";
import { service as ordersService } from "./modules/orders";
import { service as orderItemsService } from "./modules/order_items";
import { service as shippingService } from "./modules/shipping";
import { service as subgroupsService } from "./modules/subgroups";
import { service as groupsService } from "./modules/groups";
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
  optionalEnvNumber("AI_TEMPERATURE", 0.4),
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
    handler: (req) => handleGoogleRedirect(req),
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
      const allProducts = await productsService.getAll();
      const totalProducts = allProducts.length;
      const totalValue = allProducts.reduce((sum, p) => sum + p.price, 0);
      const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;
      return Response.json({ totalProducts, totalValue, avgPrice });
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
      const product = await productsService.getById(body.itemId);
      if (!product) {
        return Response.json({ error: "Product not found" }, { status: 404 });
      }
      const amountInCents = Math.round(product.price * 100);
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
    pathname: "/store/order",
    handler: async (req) => {
      const authResult = await requireAuth(req);
      if ('error' in authResult) return authResult.error;
      const userId = authResult.payload.dbUserId as number;
      if (!userId) return Response.json({ error: "User not found in session" }, { status: 401 });

      const body = await req.json() as {
        items?: { item_id: number; quantity: number; device_reference?: string }[];
        shipping_city?: string;
        shipping_address?: string;
        payment_method?: string;
      };

      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return Response.json({ error: "items is required and must be a non-empty array" }, { status: 400 });
      }
      if (!body.shipping_city || !body.shipping_address) {
        return Response.json({ error: "shipping_city and shipping_address are required" }, { status: 400 });
      }
      const validPaymentMethods = ['contraentrega', 'transferencia'];
      if (!body.payment_method || !validPaymentMethods.includes(body.payment_method)) {
        return Response.json({ error: "payment_method must be 'contraentrega' or 'transferencia'" }, { status: 400 });
      }

      // Validate items exist and get prices
      const orderItemsData: { item_id: number; quantity: number; unit_price: number; item_name: string; device_reference: string }[] = [];
      for (const entry of body.items) {
        if (!entry.item_id || !entry.quantity || entry.quantity < 1) {
          return Response.json({ error: "Each item must have item_id and quantity >= 1" }, { status: 400 });
        }
        const item = await itemsService.getById(entry.item_id);
        if (!item) {
          return Response.json({ error: `Item ${entry.item_id} not found` }, { status: 404 });
        }
        if (item.stock < entry.quantity) {
          return Response.json({ error: `Insufficient stock for item ${entry.item_id}` }, { status: 400 });
        }
        const product = await productsService.getById(item.product_id);
        if (!product) {
          return Response.json({ error: `Product for item ${entry.item_id} not found` }, { status: 404 });
        }
        // Resolve device label from subgroup -> group
        let deviceRef = entry.device_reference || '';
        if (!deviceRef && item.subgroup_id) {
          const subgroup = await subgroupsService.getById(item.subgroup_id);
          if (subgroup) {
            const group = await groupsService.getById(subgroup.group_id);
            deviceRef = group ? `${group.name} ${subgroup.name}` : subgroup.name;
          }
        }
        orderItemsData.push({
          item_id: entry.item_id,
          quantity: entry.quantity,
          unit_price: product.price,
          item_name: product.name,
          device_reference: deviceRef,
        });
      }

      // Create order
      const order = await ordersService.create({
        user_id: userId,
        date: new Date().toISOString(),
        status: 'pending',
        shipping_city: body.shipping_city,
        shipping_address: body.shipping_address,
        payment_method: body.payment_method,
        collected_info: {},
      });

      // Save shipping info to user profile if not already set
      const currentUser = await usersService.getById(userId);
      if (currentUser && (!currentUser.shipping_city_id || !currentUser.shipping_address)) {
        const shippingCity = (await shippingService.getAll()).find(s => s.city === body.shipping_city);
        const updates: Record<string, unknown> = {};
        if (!currentUser.shipping_city_id && shippingCity) updates.shipping_city_id = shippingCity.id;
        if (!currentUser.shipping_address) updates.shipping_address = body.shipping_address;
        if (Object.keys(updates).length > 0) await usersService.update(userId, updates);
      }

      // Create order items and decrement stock
      for (const oi of orderItemsData) {
        await orderItemsService.create({
          order_id: order.id!,
          item_id: oi.item_id,
          item_name: oi.item_name,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          device_reference: oi.device_reference,
          image_sent: false,
        });
        const item = await itemsService.getById(oi.item_id);
        if (item) {
          await itemsService.update(oi.item_id, { stock: item.stock - oi.quantity });
        }
      }

      return Response.json(order, { status: 201 });
    },
  },
  {
    method: "GET",
    pathname: "/store/orders",
    handler: async (req) => {
      const authResult = await requireAuth(req);
      if ('error' in authResult) return authResult.error;
      const userId = authResult.payload.dbUserId as number;
      if (!userId) return Response.json({ error: "User not found in session" }, { status: 401 });
      const orders = await ordersService.getAll({ user_id: String(userId) });
      // Attach items to each order
      const results = [];
      for (const order of orders) {
        const items = await orderItemsService.getAll({ order_id: String(order.id!) });
        results.push({ ...order, items });
      }
      // Sort by most recent first
      results.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      return Response.json(results);
    },
  },
  {
    method: "GET",
    pathname: "/store/profile",
    handler: async (req) => {
      const authResult = await requireAuth(req);
      if ('error' in authResult) return authResult.error;
      const userId = authResult.payload.dbUserId as number;
      if (!userId) return Response.json({ error: "User not found in session" }, { status: 401 });
      const user = await usersService.getById(userId);
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });
      return Response.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, shipping_city_id: user.shipping_city_id, shipping_address: user.shipping_address });
    },
  },
  {
    method: "PUT",
    pathname: "/store/profile",
    handler: async (req) => {
      const authResult = await requireAuth(req);
      if ('error' in authResult) return authResult.error;
      const userId = authResult.payload.dbUserId as number;
      if (!userId) return Response.json({ error: "User not found in session" }, { status: 401 });
      const body = await req.json() as { name?: string; phone?: string; shipping_city_id?: number; shipping_address?: string };
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        return Response.json({ error: "name is required" }, { status: 400 });
      }
      if (!body.phone || typeof body.phone !== 'string' || !body.phone.trim()) {
        return Response.json({ error: "phone is required" }, { status: 400 });
      }
      const updateData: Record<string, unknown> = { name: body.name.trim(), phone: body.phone.trim() };
      if (body.shipping_city_id !== undefined) updateData.shipping_city_id = body.shipping_city_id || null;
      if (body.shipping_address !== undefined) updateData.shipping_address = body.shipping_address?.trim() ?? '';
      const updated = await usersService.update(userId, updateData);
      return Response.json(updated);
    },
  },
  {
    method: "GET",
    pathname: "/store/shipping",
    handler: async () => {
      const cities = await shippingService.getAll();
      return Response.json(cities);
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

// Regex to match /chathistory/unblock/:userId
const unblockPattern = /^\/chathistory\/unblock\/(\d+)$/;

const COOKIE_NAME = "wpbot_session";

async function getSessionPayload(req: Request): Promise<Record<string, unknown> | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  }
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

async function requireAuth(req: Request): Promise<{ error: Response } | { payload: Record<string, unknown> }> {
  const payload = await getSessionPayload(req);
  if (!payload) {
    return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  }
  return { payload };
}

async function requireAdmin(req: Request): Promise<Response | null> {
  const result = await requireAuth(req);
  if ('error' in result) return result.error;
  if (result.payload.role !== "admin") {
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
    const isPublicRead = req.method === "GET" && (pathname === "/products" || /^\/products\/\d+$/.test(pathname) || pathname === "/items" || /^\/items\/\d+$/.test(pathname) || pathname === "/groups" || /^\/groups\/\d+$/.test(pathname) || pathname === "/subgroups" || /^\/subgroups\/\d+$/.test(pathname));
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

  // Custom route: POST /chathistory/unblock/:userId
  const unblockMatch = req.method === "POST" && pathname.match(unblockPattern);
  if (unblockMatch) {
    const adminError = await requireAdmin(req);
    if (adminError) return withCors(adminError, WEB_ORIGIN);
    const targetUserId = parseInt(unblockMatch[1]!, 10);
    await chatHistoryService.unblockConversation(targetUserId);
    // Insert a resumption message so the conversation flows naturally
    await chatHistoryService.addMessage(
      targetUserId,
      "Listo, ya puedo ayudarte. ¿En qué te puedo colaborar?",
      "assistant",
    );
    const res = Response.json({ success: true });
    return withCors(res, WEB_ORIGIN);
  }

  return withCors(new Response("Not Found", { status: 404 }), WEB_ORIGIN);
}

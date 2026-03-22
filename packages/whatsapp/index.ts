import { handleWebhook, handleVerification } from "./src/webhook";
import { optionalEnvNumber } from "@wpbot/shared";

const PORT = optionalEnvNumber("WHATSAPP_PORT", 4002);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname === "/webhook") {
      if (req.method === "GET") return handleVerification(req);
      if (req.method === "POST") return handleWebhook(req);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`📱 WhatsApp bot running on http://localhost:${server.port}`);

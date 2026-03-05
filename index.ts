import { router } from "./src/router";

const server = Bun.serve({
  port: process.env.PORT || 4000,
  fetch: router,
});

console.log(`🚀 WhatsApp Echo Bot running on http://localhost:${server.port}`);
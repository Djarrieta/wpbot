import { router } from "./src/router";

const server = Bun.serve({
  port: Bun.env.PORT || 4000,
  fetch: router,
});

console.log(`🚀 API running on http://localhost:${server.port}`);
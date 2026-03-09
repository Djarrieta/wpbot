import { router } from "./src/router";
import { initModules } from "./src/modules";

await initModules();

const server = Bun.serve({
  port: Bun.env.PORT || 4000,
  fetch: router,
});

console.log(`🚀 API running on http://localhost:${server.port}`);
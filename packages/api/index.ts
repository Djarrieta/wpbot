import { router } from "./src/router";
import { initModules } from "./src/modules";
import { optionalEnvNumber } from "@wpbot/shared";

await initModules();

const server = Bun.serve({
  port: optionalEnvNumber("PORT", 4000),
  fetch: router,
});

console.log(`🚀 API running on http://localhost:${server.port}`);
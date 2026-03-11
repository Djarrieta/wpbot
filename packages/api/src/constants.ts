if (!Bun.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
if (!Bun.env.DATABASE_READONLY_URL) {
  throw new Error('DATABASE_READONLY_URL environment variable is required');
}

export const PG_CONNECTION_STRING = Bun.env.DATABASE_URL;
export const PG_READONLY_CONNECTION_STRING = Bun.env.DATABASE_READONLY_URL;
export const MCP_CONFIG = 'src/mcpConfig/mcp.config.json';
export const MCP_READONLY_CONFIG = 'src/mcpConfig/mcp.readonly.config.json';

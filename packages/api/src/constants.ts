export const PG_CONNECTION_STRING = Bun.env.DATABASE_URL || 'postgresql://wpbot:wpbot@localhost:4003/wpbot';
export const MCP_CONFIG_READONLY = 'src/mcpConfig/mcp.config.readonly.json';
export const MCP_CONFIG_READWRITE = 'src/mcpConfig/mcp.config.readwrite.json';

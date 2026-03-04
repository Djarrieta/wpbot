import { MCPAgent, MCPClient } from "mcp-use";
import { readFile } from "fs/promises";
import path from "path";
import { ResponseService } from "./core/responseService";
import { getLLMInstance } from "./llmService";

let agent: MCPAgent | null = null;
let client: MCPClient | null = null;

export class MCPService extends ResponseService {
  private maxSteps: number;

  constructor(maxSteps: number = 8) {
    super();
    this.maxSteps = maxSteps;
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!prompt?.trim()) throw new Error("Prompt empty");

    if (!agent) {
      const config = await this.loadMCPConfig();
      client = MCPClient.fromDict(config);

      const llm = getLLMInstance();

      agent = new MCPAgent({ llm, client, maxSteps: this.maxSteps });
    }

    return agent.run(prompt, this.maxSteps);
  }

  private async loadMCPConfig(): Promise<any> {
    const cwd = process.cwd();
    const file = path.join(cwd, "src/mcpConfig/mcp.config.json");

    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (err) {
      throw new Error(
        "Required mcp.config.json not found in src/mcpConfig/. Please create it to define mcpServers."
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        "Invalid JSON in mcp.config.json: " + (err as Error).message
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error(
        "mcp.config.json must contain a JSON object at the top level"
      );
    }
    if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
      throw new Error(
        "mcp.config.json must include a 'mcpServers' object mapping server names to their definitions"
      );
    }
    return parsed;
  }

  async close(): Promise<void> {
    if (client) {
      await client.closeAllSessions();
    }
    agent = null;
    client = null;
  }
}

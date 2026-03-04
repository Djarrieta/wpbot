import { MCPAgent, MCPClient } from "mcp-use";
import { readFile } from "fs/promises";
import path from "path";
import { ResponseGenerator } from "../core/responseGenerator";
import { LLMProvider } from "../core/llmProvider";

let agent: MCPAgent | null = null;
let client: MCPClient | null = null;

export class MCPService extends ResponseGenerator {
  private maxSteps: number;
  private llmProvider: LLMProvider;
  private configPath: string;

  constructor(llmProvider: LLMProvider, configPath: string, maxSteps: number) {
    super();
    this.llmProvider = llmProvider;
    this.configPath = configPath;
    this.maxSteps = maxSteps;
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!prompt?.trim()) throw new Error("Prompt empty");

    if (!agent) {
      const config = await this.loadMCPConfig();
      client = MCPClient.fromDict(config);

      const llm = this.llmProvider.getInstance();

      agent = new MCPAgent({ llm, client, maxSteps: this.maxSteps });
    }

    return agent.run(prompt, this.maxSteps);
  }

  private async loadMCPConfig(): Promise<any> {
    const cwd = process.cwd();
    const file = path.join(cwd, this.configPath);

    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (err) {
      throw new Error(
        `Required MCP config not found at ${this.configPath}. Please create it to define mcpServers.`
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Invalid JSON in ${this.configPath}: ` + (err as Error).message
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error(
        `${this.configPath} must contain a JSON object at the top level`
      );
    }
    if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
      throw new Error(
        `${this.configPath} must include a 'mcpServers' object mapping server names to their definitions`
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

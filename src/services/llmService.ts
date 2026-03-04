import { ChatOpenAI } from "@langchain/openai";
import { LLMService } from "./core/llmService";
export { LLMService } from "./core/llmService";

export class DeepSeekLLMService extends LLMService {
  getInstance(): ChatOpenAI {
    if (!this.instance) {
      const apiKey = Bun.env.DEEPSEEK_API_KEY;
      const modelName = Bun.env.DEEPSEEK_MODEL;
      const baseURL = Bun.env.DEEPSEEK_BASE_URL;

      if (!apiKey) throw new Error("Missing required env var: DEEPSEEK_API_KEY");
      if (!modelName) throw new Error("Missing required env var: DEEPSEEK_MODEL");

      this.instance = new ChatOpenAI({
        modelName,
        temperature: 0.2,
        apiKey,
        configuration: baseURL ? { baseURL } : undefined,
      });
    }
    return this.instance;
  }
}

import { ChatOpenAI } from "@langchain/openai";
import { LLMProvider } from "../core/llmProvider";

export class DeepSeekLLMProvider extends LLMProvider {
  private apiKey: string;
  private modelName: string;
  private baseURL?: string;

  constructor(apiKey: string, modelName: string, baseURL?: string) {
    super();
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseURL = baseURL;
  }

  getInstance(): ChatOpenAI {
    if (!this.instance) {
      this.instance = new ChatOpenAI({
        modelName: this.modelName,
        temperature: 0.2,
        apiKey: this.apiKey,
        configuration: this.baseURL ? { baseURL: this.baseURL } : undefined,
      });
    }
    return this.instance;
  }
}

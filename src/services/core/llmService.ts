import { ChatOpenAI } from "@langchain/openai";

export abstract class LLMService {
  protected instance: ChatOpenAI | null = null;

  abstract getInstance(): ChatOpenAI;

  reset(): void {
    this.instance = null;
  }
}

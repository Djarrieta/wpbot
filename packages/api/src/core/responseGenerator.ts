import { PG_CONNECTION_STRING, PG_ASSISTANT_CONNECTION_STRING } from "../constants";

export abstract class ResponseGenerator {
  abstract generateResponse(prompt: string): Promise<string>;

  protected interpolateConfigPlaceholders(config: string): string {
    return config
      .replace(/\{\{PG_CONNECTION_STRING\}\}/g, PG_CONNECTION_STRING)
      .replace(/\{\{PG_ASSISTANT_CONNECTION_STRING\}\}/g, PG_ASSISTANT_CONNECTION_STRING);
  }
}

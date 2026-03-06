import { DB_PATH } from "../constants";

export abstract class ResponseGenerator {
  abstract generateResponse(prompt: string): Promise<string>;

  protected interpolateConfigPlaceholders(config: string): string {
    return config.replace(/\{\{DB_PATH\}\}/g, DB_PATH);
  }
}

export abstract class ResponseGenerator {
  abstract generateResponse(prompt: string): Promise<string>;
}

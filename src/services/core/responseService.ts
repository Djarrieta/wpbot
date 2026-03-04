/**
 * Abstract service for generating responses from prompts
 */
export abstract class ResponseService {
  abstract generateResponse(prompt: string): Promise<string>;
}

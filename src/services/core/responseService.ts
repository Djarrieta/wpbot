
export abstract class ResponseService {
  abstract generateResponse(prompt: string): Promise<string>;
}

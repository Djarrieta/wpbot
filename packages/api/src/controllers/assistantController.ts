import { ResponseGenerator } from "../core/responseGenerator";
import type { GenericCrudController } from "../core/crudController";
import type { BaseEntity } from "../core/repository";
import type { ChatHistoryRepository } from "../modules/chathistory/service";

export class AssistantController {
  private readonly responseGenerator: ResponseGenerator;
  private readonly controllers: GenericCrudController<BaseEntity>[];
  private readonly promptTemplate: string;
  private readonly chatHistoryService: ChatHistoryRepository;

  constructor(
    responseGenerator: ResponseGenerator,
    controllers: GenericCrudController<BaseEntity>[],
    promptTemplate: string,
    chatHistoryService: ChatHistoryRepository
  ) {
    this.responseGenerator = responseGenerator;
    this.controllers = controllers;
    this.promptTemplate = promptTemplate;
    this.chatHistoryService = chatHistoryService;
  }

  private async buildPrompt(userMessage: string, userId: number): Promise<string> {
    const schema = this.controllers
      .map((c) => `- ${c.schemaText()}`)
      .join('\n');

    const history = await this.chatHistoryService.getByUserId(userId);
    const conversationHistory = history.length > 0
      ? history.map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.message}`).join('\n')
      : 'No hay conversación previa.';

    return this.promptTemplate
      .replace('{{schema}}', schema)
      .replace('{{conversationHistory}}', conversationHistory)
      .replace('{{userMessage}}', userMessage);
  }

  async handle(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { message?: string; userId?: number };

      if (!body.message?.trim()) {
        return Response.json(
          { error: "message is required" },
          { status: 400 }
        );
      }

      if (!body.userId) {
        return Response.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }

      const prompt = await this.buildPrompt(body.message, body.userId);

      console.log(prompt)

      // Save user message to history
      await this.chatHistoryService.addMessage(body.userId, body.message, 'user');

      const response = await this.responseGenerator.generateResponse(prompt);

      // Save assistant response to history
      await this.chatHistoryService.addMessage(body.userId, response, 'assistant');

      return Response.json({ response });
    } catch (error) {
      console.error("Error processing assistant request:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}

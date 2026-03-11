import { ResponseGenerator } from "../core/responseGenerator";
import type { GenericCrudController } from "../core/crudController";
import type { BaseEntity } from "../core/repository";

export class AssistantController {
  private readonly responseGenerator: ResponseGenerator;
  private readonly controllers: GenericCrudController<BaseEntity>[];
  private readonly promptTemplate: string;

  constructor(
    responseGenerator: ResponseGenerator,
    controllers: GenericCrudController<BaseEntity>[],
    promptTemplate: string
  ) {
    this.responseGenerator = responseGenerator;
    this.controllers = controllers;
    this.promptTemplate = promptTemplate;
  }

  private buildPrompt(userMessage: string): string {
    const schema = this.controllers
      .map((c) => `- ${c.schemaText()}`)
      .join('\n');

    return this.promptTemplate
      .replace('{{schema}}', schema)
      .replace('{{userMessage}}', userMessage);
  }

  async handle(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { message?: string };

      if (!body.message?.trim()) {
        return Response.json(
          { error: "message is required" },
          { status: 400 }
        );
      }

      const prompt = this.buildPrompt(body.message);

      const response = await this.responseGenerator.generateResponse(prompt);

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

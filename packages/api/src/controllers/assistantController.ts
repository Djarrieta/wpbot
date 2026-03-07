import { ResponseGenerator } from "../core/responseGenerator";
import { ItemsController } from "./itemsController";

export class AssistantController {
  private readonly responseGenerator: ResponseGenerator;
  private readonly itemsController?: ItemsController;

  constructor(
    responseGenerator: ResponseGenerator,
    itemsController?: ItemsController
  ) {
    this.responseGenerator = responseGenerator;
    this.itemsController = itemsController;
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

      const prompt = this.itemsController
        ? this.itemsController.buildPrompt(body.message)
        : body.message;

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

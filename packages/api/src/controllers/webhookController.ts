import { MessagingService } from "../core/messagingService";
import { ResponseGenerator } from "../core/responseGenerator";
import { ItemsController } from "./itemsController";

export class WebhookController {
  private readonly messagingService: MessagingService;
  private readonly responseGenerator?: ResponseGenerator;
  private readonly itemsController?: ItemsController;

  constructor(
    messagingService: MessagingService, 
    responseGenerator?: ResponseGenerator,
    itemsController?: ItemsController
  ) {
    this.messagingService = messagingService;
    this.responseGenerator = responseGenerator;
    this.itemsController = itemsController;
  }

  handleVerification(req: Request): Response {
    const result = this.messagingService.verifyWebhook(req);

    if (!result) {
      return new Response("Not Implemented", { status: 501 });
    }

    if (result.valid) {
      console.log("Webhook verified successfully");
      return new Response(result.challenge || "OK", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  async handleEvent(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      console.log("Received webhook:", JSON.stringify(body, null, 2));

      const message = this.messagingService.parseIncomingMessage(body);

      let responseText: string = "OK";
      if (message) {

        if (this.responseGenerator) {
          const prompt = this.itemsController 
            ? this.itemsController.buildPrompt(message.text)
            : message.text;
          responseText = await this.responseGenerator.generateResponse(prompt);
        } else {
          // Simple echo fallback
          responseText = `Echo: ${message.text}`;
          
          
        }
        
        // await this.messagingService.sendMessage(message.from, responseText);
      }
      return new Response(responseText, { status: 200, statusText: "OK" });

    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
    }
  }
}

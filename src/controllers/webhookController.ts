import { MessagingService } from "../services/core/messagingService";
import { ResponseService } from "../services/core/responseService";

export class WebhookController {
  private readonly messagingService: MessagingService;
  private readonly responseService?: ResponseService;

  constructor(messagingService: MessagingService, responseService?: ResponseService) {
    this.messagingService = messagingService;
    this.responseService = responseService;
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

      if (message) {
        let responseText: string;

        if (this.responseService) {
          // Use LLM/MCP to generate response
          responseText = await this.responseService.generateResponse(message.text);
        } else {
          // Simple echo fallback
          responseText = `Echo: ${message.text}`;
        }

        await this.messagingService.sendMessage(message.from, responseText);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
    }
  }
}

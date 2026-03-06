import { MessagingService } from "../core/messagingService";
import { ResponseGenerator } from "../core/responseGenerator";

export class WebhookController {
  private readonly messagingService: MessagingService;
  private readonly responseGenerator?: ResponseGenerator;

  constructor(messagingService: MessagingService, responseGenerator?: ResponseGenerator) {
    this.messagingService = messagingService;
    this.responseGenerator = responseGenerator;
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

        if (this.responseGenerator) {
          // Use LLM/MCP to generate response
          responseText = await this.responseGenerator.generateResponse(message.text);
        } else {
          // Simple echo fallback
          responseText = `Echo: ${message.text}`;
          
        }
        return new Response("OK", { status: 200,statusText:responseText });

       // await this.messagingService.sendMessage(message.from, responseText);
      }

      return new Response("OK", { status: 200, });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
    }
  }
}

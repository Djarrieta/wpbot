import { MessagingService } from "../services/messagingService";

export class WebhookController {
  private readonly messagingService: MessagingService;

  constructor(messagingService: MessagingService) {
    this.messagingService = messagingService;
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
        await this.messagingService.sendMessage(
          message.from,
          `Echo: ${message.text}`
        );
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
    }
  }
}

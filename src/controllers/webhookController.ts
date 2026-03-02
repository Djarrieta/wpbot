import { WhatsAppService } from "../services/whatsappService";

export class WebhookController {
  private readonly verifyToken = process.env.VERIFY_TOKEN || "";
  private readonly whatsapp = new WhatsAppService();

  handleVerification(req: Request): Response {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === this.verifyToken) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  async handleEvent(req: Request): Promise<Response> {
    try {
      const body = (await req.json()) as any;
      console.log("Received webhook:", JSON.stringify(body, null, 2));

      const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

      if (messages && messages.length > 0) {
        for (const message of messages) {
          const from: string = message.from;
          const msgType: string = message.type;
          const echoText =
            msgType === "text" ? message.text.body : `Received a ${msgType} message`;

          await this.whatsapp.sendMessage(from, `Echo: ${echoText}`);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
    }
  }
}

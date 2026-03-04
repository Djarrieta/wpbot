import { MessagingService, type IncomingMessage, type VerificationResult } from "./messagingService";

export class WhatsAppService extends MessagingService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;
  private apiVersion: string;
  private verifyToken: string;

  constructor(
    accessToken: string,
    phoneNumberId: string,
    baseUrl: string,
    apiVersion: string,
    verifyToken: string = ""
  ) {
    super();
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.verifyToken = verifyToken;
  }

  parseIncomingMessage(body: any): IncomingMessage | null {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

    if (!messages || messages.length === 0) {
      return null;
    }

    const message = messages[0];
    const from = message.from;
    const text =
      message.type === "text"
        ? message.text.body
        : `Received a ${message.type} message`;

    return { from, text };
  }

  override verifyWebhook(req: Request): VerificationResult | null {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === this.verifyToken) {
      return { valid: true, challenge: challenge || undefined };
    }

    return { valid: false };
  }

  async sendMessage(to: string, text: string) {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    const result = await response.json();
    console.log("Message sent:", JSON.stringify(result, null, 2));
    return result;
  }
}

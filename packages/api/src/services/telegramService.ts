import { MessagingService, type IncomingMessage } from "../core/messagingService";

export class TelegramService extends MessagingService {
  private botToken: string;
  private baseUrl: string;

  constructor(botToken: string, baseUrl: string = "https://api.telegram.org") {
    super();
    this.botToken = botToken;
    this.baseUrl = baseUrl;
  }

  parseIncomingMessage(body: any): IncomingMessage | null {
    const message = body.message;

    if (!message) {
      return null;
    }

    const from = message.chat.id.toString();
    const text = message.text
      ? message.text
      : `Received a ${
          Object.keys(message).find(
            (key) => !["message_id", "from", "chat", "date"].includes(key)
          ) || "unknown"
        } message`;

    return { from, text };
  }

  async sendMessage(to: string, text: string) {
    const url = `${this.baseUrl}/bot${this.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: to,
        text,
      }),
    });

    const result = await response.json();
    console.log("Telegram message sent:", JSON.stringify(result, null, 2));
    return result;
  }
}

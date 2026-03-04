import { MessagingService } from "./messagingService";

export class WhatsAppService extends MessagingService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor(
    accessToken: string,
    phoneNumberId: string,
    baseUrl: string,
    apiVersion: string
  ) {
    super();
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
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

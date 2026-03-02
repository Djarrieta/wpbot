export class WhatsAppService {
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  private readonly phoneNumberId = process.env.PHONE_NUMBER_ID || "";
  private readonly baseUrl = process.env.GRAPH_API_BASE_URL || "";
  private readonly apiVersion = process.env.GRAPH_API_VERSION || "";

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

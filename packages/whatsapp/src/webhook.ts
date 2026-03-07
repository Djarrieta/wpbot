const ACCESS_TOKEN = Bun.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = Bun.env.WHATSAPP_PHONE_NUMBER_ID!;
const BASE_URL = Bun.env.WHATSAPP_BASE_URL!;
const API_VERSION = Bun.env.WHATSAPP_API_VERSION!;
const VERIFY_TOKEN = Bun.env.WHATSAPP_VERIFY_TOKEN || "";
const API_URL = Bun.env.API_URL || "http://localhost:4000";

interface IncomingMessage {
  from: string;
  text: string;
}

function parseIncomingMessage(body: any): IncomingMessage | null {
  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
  if (!messages || messages.length === 0) return null;

  const message = messages[0];
  const from = message.from;
  const text =
    message.type === "text"
      ? message.text.body
      : null;

  if (!text) return null;
  return { from, text };
}

async function sendMessage(to: string, text: string) {
  const url = `${BASE_URL}/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
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

async function callAssistant(message: string): Promise<string> {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    console.error("Assistant API error:", response.status);
    return "Lo siento, hubo un error procesando tu mensaje.";
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}

export function handleVerification(req: Request): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new Response(challenge || "OK", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function handleWebhook(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));

    const message = parseIncomingMessage(body);
    if (message) {
      const responseText = await callAssistant(message.text);
      await sendMessage(message.from, responseText);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("OK", { status: 200 });
  }
}

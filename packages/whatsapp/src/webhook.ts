import { requireEnv, optionalEnv } from "@wpbot/shared";

const ACCESS_TOKEN = requireEnv("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
const BASE_URL = requireEnv("WHATSAPP_BASE_URL");
const API_VERSION = requireEnv("WHATSAPP_API_VERSION");
const VERIFY_TOKEN = optionalEnv("WHATSAPP_VERIFY_TOKEN", "");
const API_URL = optionalEnv("API_URL", "http://localhost:4000");
const DEBOUNCE_MS = Number(optionalEnv("DEBOUNCE_MS", "3000"));

interface IncomingMessage {
  from: string;
  text: string;
}

function parseIncomingMessage(body: any): IncomingMessage | null {
  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
  if (!messages || messages.length === 0) return null;

  const message = messages[0];
  const from = message.from;

  if (message.type === "text") {
    return { from, text: message.text.body };
  }

  if (message.type === "image") {
    return { from, text: "[imagen recibida]" };
  }

  return null;
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

async function callAssistant(message: string, phoneNumber: string): Promise<string | null> {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, provider: 'whatsapp', providerId: phoneNumber }),
  });

  if (!response.ok) {
    console.error("Assistant API error:", response.status);
    return null;
  }

  const data = (await response.json()) as { response: string; blocked?: boolean };
  if (data.blocked) return null;
  return data.response;
}

const pendingMessages = new Map<
  string,
  {
    messages: string[];
    timer: Timer;
  }
>();

const processingUsers = new Set<string>();

async function processMessages(phoneNumber: string) {
  const pending = pendingMessages.get(phoneNumber);
  if (!pending) return;

  if (processingUsers.has(phoneNumber)) return;

  pendingMessages.delete(phoneNumber);
  processingUsers.add(phoneNumber);

  const combinedMessage = pending.messages.join("\n");
  console.log(
    `Processing ${pending.messages.length} buffered message(s) from ${phoneNumber}`,
  );

  try {
    const responseText = await callAssistant(combinedMessage, phoneNumber);
    if (responseText) {
      await sendMessage(phoneNumber, responseText);
    }
  } finally {
    processingUsers.delete(phoneNumber);

    const next = pendingMessages.get(phoneNumber);
    if (next) {
      clearTimeout(next.timer);
      next.timer = setTimeout(() => processMessages(phoneNumber), DEBOUNCE_MS);
    }
  }
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
      const pending = pendingMessages.get(message.from);
      if (pending) {
        pending.messages.push(message.text);
        clearTimeout(pending.timer);
        pending.timer = setTimeout(
          () => processMessages(message.from),
          DEBOUNCE_MS,
        );
      } else {
        pendingMessages.set(message.from, {
          messages: [message.text],
          timer: setTimeout(() => processMessages(message.from), DEBOUNCE_MS),
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("OK", { status: 200 });
  }
}

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "";
const GRAPH_API_BASE_URL = process.env.GRAPH_API_BASE_URL || "";
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "";

const server = Bun.serve({
  port: process.env.PORT || 3000,

  async fetch(req) {
    const url = new URL(req.url);

    // Webhook verification (GET)
    if (req.method === "GET" && url.pathname === "/webhook") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // Webhook events (POST)
    if (req.method === "POST" && url.pathname === "/webhook") {
      try {
        const body = (await req.json()) as any;
        console.log("Received webhook:", JSON.stringify(body, null, 2));

        // Process incoming messages
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          for (const message of messages) {
            const from = message.from; // sender phone number
            const msgType = message.type;

            let echoText = "";

            if (msgType === "text") {
              echoText = message.text.body;
            } else {
              echoText = `Received a ${msgType} message`;
            }

            // Send echo reply
            await sendWhatsAppMessage(from, `Echo: ${echoText}`);
          }
        }

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response("OK", { status: 200 }); // Always return 200 to avoid retries
      }
    }

    // Health check
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("WhatsApp Echo Bot is running!", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text },
    }),
  });

  const result = await response.json();
  console.log("Message sent:", JSON.stringify(result, null, 2));
  return result;
}

console.log(`🚀 WhatsApp Echo Bot running on http://localhost:${server.port}`);
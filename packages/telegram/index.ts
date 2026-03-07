import { Telegraf } from "telegraf";

const BOT_TOKEN = Bun.env.TELEGRAM_BOT_TOKEN!;
const API_URL = Bun.env.API_URL || "http://localhost:4000";

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

const bot = new Telegraf(BOT_TOKEN);

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  console.log(`Message from ${ctx.from.id}: ${userMessage}`);

  try {
    const responseText = await callAssistant(userMessage);
    await ctx.reply(responseText);
  } catch (error) {
    console.error("Error processing message:", error);
    await ctx.reply("Lo siento, hubo un error procesando tu mensaje.");
  }
});

bot.launch();
console.log("🤖 Telegram bot started (polling)");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

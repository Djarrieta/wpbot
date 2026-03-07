import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const BOT_TOKEN = Bun.env.TELEGRAM_BOT_TOKEN!;
const API_URL = Bun.env.API_URL || "http://localhost:4000";

async function callAssistant(userMessage: string): Promise<string> {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage }),
  });

  if (!response.ok) {
    console.error("Assistant API error:", response.status);
    return "Lo siento, hubo un error procesando tu mensaje.";
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}

const bot = new Telegraf(BOT_TOKEN);

bot.on(message("text"), async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Estoy teniendo problemas en el sistema. Dame un momento por favor.");
    return;
  }

  const userMessage = ctx.message.text;
  console.log(`Message from ${userId}: ${userMessage}`);

  try {
    await ctx.sendChatAction("typing");
    const responseText = await callAssistant(userMessage);
    await ctx.reply(responseText);
  } catch (error) {
    console.error("Error processing message:", error);
    await ctx.reply("Lo siento, hubo un error procesando tu mensaje.");
  }
});

bot.catch((err, ctx) => {
  console.error("Telegraf error:", err);
  ctx.reply("Estoy teniendo problemas en el sistema. Dame un momento por favor.").catch(console.error);
});

bot.launch();
console.log("🤖 Telegram bot started (polling)");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

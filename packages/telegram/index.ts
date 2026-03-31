import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { requireEnv, optionalEnv } from "@wpbot/shared";

const BOT_TOKEN = requireEnv("TELEGRAM_BOT_TOKEN");
const API_URL = optionalEnv("API_URL", "http://localhost:4000");

async function callAssistant(userMessage: string, telegramId: number, name?: string): Promise<string | null> {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage, provider: 'telegram', providerId: String(telegramId), name }),
  });

  if (!response.ok) {
    console.error("Assistant API error:", response.status);
    return null;
  }

  const data = (await response.json()) as { response: string; blocked?: boolean };
  if (data.blocked) return null;
  return data.response;
}

const bot = new Telegraf(BOT_TOKEN);

bot.on(message("text"), async (ctx) => {
  const user = ctx.from;
  if (!user) {
    await ctx.reply("Estoy teniendo problemas en el sistema. Dame un momento por favor.");
    return;
  }

  const userId = user.id;
  const name = user.username || [user.first_name, user.last_name].filter(Boolean).join(" ");
  const userMessage = ctx.message.text;
  console.log(`Message from ${userId} (${name}): ${userMessage}`);

  try {
    await ctx.sendChatAction("typing");
    const responseText = await callAssistant(userMessage, userId, name || undefined);
    if (responseText) await ctx.reply(responseText);
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

bot.on(message("photo"), async (ctx) => {
  const user = ctx.from;
  if (!user) {
    await ctx.reply("Estoy teniendo problemas en el sistema. Dame un momento por favor.");
    return;
  }

  const userId = user.id;
  const name = user.username || [user.first_name, user.last_name].filter(Boolean).join(" ");
  console.log(`Photo from ${userId} (${name})`);

  try {
    await ctx.sendChatAction("typing");
    const responseText = await callAssistant("[imagen recibida]", userId, name || undefined);
    if (responseText) await ctx.reply(responseText);
  } catch (error) {
    console.error("Error processing photo message:", error);
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

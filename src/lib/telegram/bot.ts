import { Bot, InlineKeyboard } from "grammy";

// Singleton bot instance
const globalForBot = globalThis as unknown as { bot: Bot | undefined };

function createBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return new Bot(token);
}

export const bot = globalForBot.bot ?? createBot();
if (process.env.NODE_ENV !== "production") globalForBot.bot = bot;

/**
 * Send a notification to a Telegram user
 */
export async function sendTelegramMessage(
  telegramId: bigint | number,
  text: string,
  keyboard?: InlineKeyboard
) {
  try {
    await bot.api.sendMessage(Number(telegramId), text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("[telegram] Failed to send message:", error);
  }
}

/**
 * Build the "Open Mini App" inline keyboard
 */
export function miniAppButton(path: string = "/", label: string = "Open StockTrace") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new InlineKeyboard().webApp(label, `${appUrl}/tg${path}`);
}

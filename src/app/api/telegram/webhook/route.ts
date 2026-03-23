import { NextResponse } from "next/server";
import { bot, miniAppButton } from "@/lib/telegram/bot";
import { prisma } from "@/lib/prisma";
import { InlineKeyboard } from "grammy";

// Register bot commands
bot.command("start", async (ctx) => {
  const keyboard = miniAppButton("/", "Open StockTrace");
  await ctx.reply(
    "Welcome to <b>StockTrace</b>! 🏪\n\n" +
    "Track inventory, process orders, and manage your restaurant chain.\n\n" +
    "To get started, link your account using your staff code:\n" +
    "/link YOUR_CODE\n\n" +
    "Once linked, tap the button below to open the app.",
    { parse_mode: "HTML", reply_markup: keyboard }
  );
});

bot.command("link", async (ctx) => {
  const code = ctx.message?.text?.split(" ")[1]?.trim().toUpperCase();
  if (!code) {
    await ctx.reply("Please provide your staff code:\n<code>/link YOUR_CODE</code>", { parse_mode: "HTML" });
    return;
  }

  const telegramId = BigInt(ctx.from!.id);

  // Check if already linked
  const existing = await prisma.telegramLink.findUnique({ where: { telegramId } });
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing.userId } });
    await ctx.reply(`You're already linked as <b>${user?.name}</b>. Use the button below to open StockTrace.`, {
      parse_mode: "HTML",
      reply_markup: miniAppButton(),
    });
    return;
  }

  // Find user by link code
  const user = await prisma.user.findUnique({ where: { linkCode: code } });
  if (!user) {
    await ctx.reply("Invalid code. Please check with your admin and try again.");
    return;
  }

  // Create link
  await prisma.telegramLink.create({
    data: {
      userId: user.id,
      telegramId,
      telegramName: ctx.from?.first_name || ctx.from?.username || null,
    },
  });

  // Clear the link code (one-time use)
  await prisma.user.update({
    where: { id: user.id },
    data: { linkCode: null },
  });

  await ctx.reply(
    `Account linked successfully!\n\n` +
    `<b>Name:</b> ${user.name}\n` +
    `<b>Role:</b> ${user.role === "WAREHOUSE_ADMIN" ? "Warehouse Admin" : "Restaurant Staff"}\n\n` +
    `Tap the button below to start using StockTrace.`,
    { parse_mode: "HTML", reply_markup: miniAppButton() }
  );
});

bot.command("stock", async (ctx) => {
  const telegramId = BigInt(ctx.from!.id);
  const link = await prisma.telegramLink.findUnique({ where: { telegramId } });
  if (!link) {
    await ctx.reply("Please link your account first: /link YOUR_CODE");
    return;
  }

  const items = await prisma.inventoryItem.groupBy({
    by: ["categoryId"],
    where: { status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] } },
    _sum: { unitCount: true },
  });

  if (items.length === 0) {
    await ctx.reply("No stock currently in warehouse.");
    return;
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: items.map((i) => i.categoryId) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const lines = items.map((i) =>
    `• ${catMap[i.categoryId] || "Unknown"}: <b>${i._sum.unitCount || 0}</b> units`
  );

  await ctx.reply(
    `<b>Current Stock</b>\n\n${lines.join("\n")}`,
    { parse_mode: "HTML", reply_markup: miniAppButton("/stock", "View Details") }
  );
});

// Handle callback queries (approve/reject buttons)
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("approve:") || data.startsWith("reject:")) {
    const [action, requestId] = data.split(":");
    const telegramId = BigInt(ctx.from.id);
    const link = await prisma.telegramLink.findUnique({
      where: { telegramId },
      include: { user: true },
    });

    if (!link || link.user.role !== "WAREHOUSE_ADMIN") {
      await ctx.answerCallbackQuery({ text: "Not authorized" });
      return;
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { restaurant: true },
    });

    if (!request || request.status !== "PENDING") {
      await ctx.answerCallbackQuery({ text: "Request no longer pending" });
      return;
    }

    if (action === "approve") {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "PACKING", packedAt: new Date() },
      });
      await ctx.answerCallbackQuery({ text: "Request approved!" });
      await ctx.editMessageText(
        `✅ <b>Approved:</b> ${request.requestNumber}\n${request.restaurant.name}`,
        { parse_mode: "HTML", reply_markup: miniAppButton(`/requests`, "Open in App") }
      );
    } else {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });
      await ctx.answerCallbackQuery({ text: "Request rejected" });
      await ctx.editMessageText(
        `❌ <b>Rejected:</b> ${request.requestNumber}\n${request.restaurant.name}`,
        { parse_mode: "HTML" }
      );
    }
  }
});

export async function POST(req: Request) {
  // Validate webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const body = await req.json();

  try {
    await bot.handleUpdate(body);
  } catch (error) {
    console.error("[telegram webhook] Error handling update:", error);
  }

  return NextResponse.json({ ok: true });
}

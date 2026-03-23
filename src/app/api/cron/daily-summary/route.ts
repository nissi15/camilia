import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import { formatRwf } from "@/lib/constants";

export async function GET(req: NextRequest) {
  // Validate cron secret (for Vercel Cron or external scheduler)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Gather today's stats
  const [received, processed, waste, pendingRequests] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { status: "RECEIVED", createdAt: { gte: today } },
      select: { weightGrams: true },
    }),
    prisma.processingStep.findMany({
      where: {
        completedAt: { gte: today },
        stepType: { in: ["BUTCHER", "PORTION", "PACKAGE"] },
      },
      select: { inputWeight: true, outputWeight: true, wasteWeight: true },
    }),
    prisma.inventoryItem.findMany({
      where: { status: "WASTE", createdAt: { gte: today } },
      select: { weightGrams: true, costRwf: true },
    }),
    prisma.request.count({ where: { status: "PENDING" } }),
  ]);

  const receivedWeight = received.reduce((s, i) => s + Number(i.weightGrams || 0), 0);
  const processedInput = processed.reduce((s, i) => s + Number(i.inputWeight || 0), 0);
  const processedOutput = processed.reduce((s, i) => s + Number(i.outputWeight || 0), 0);
  const wasteWeight = waste.reduce((s, i) => s + Number(i.weightGrams || 0), 0);
  const wasteCost = waste.reduce((s, i) => s + Number(i.costRwf || 0), 0);
  const yieldPct = processedInput > 0 ? ((processedOutput / processedInput) * 100).toFixed(1) : "N/A";

  const message =
    `<b>📊 Daily Summary</b>\n` +
    `<i>${today.toLocaleDateString("en-RW", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</i>\n\n` +
    `<b>Received:</b> ${received.length} items (${(receivedWeight / 1000).toFixed(1)}kg)\n` +
    `<b>Processed:</b> ${processed.length} steps\n` +
    `<b>Yield:</b> ${yieldPct}%\n` +
    `<b>Waste:</b> ${(wasteWeight / 1000).toFixed(1)}kg (${formatRwf(wasteCost)})\n` +
    `<b>Pending Requests:</b> ${pendingRequests}\n`;

  // Send to all linked users
  const links = await prisma.telegramLink.findMany();
  for (const link of links) {
    await sendTelegramMessage(link.telegramId, message);
  }

  return NextResponse.json({
    sent: links.length,
    summary: {
      receivedCount: received.length,
      receivedWeightKg: (receivedWeight / 1000).toFixed(1),
      processedSteps: processed.length,
      yieldPercent: yieldPct,
      wasteWeightKg: (wasteWeight / 1000).toFixed(1),
      wasteCostRwf: wasteCost,
      pendingRequests,
    },
  });
}

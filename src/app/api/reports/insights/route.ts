import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;
  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const warehouseId = user!.locationId!;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // ── 1. Waste Cost Summary: this month vs last month ─────────────────────

  const [thisMonthSteps, lastMonthSteps] = await Promise.all([
    prisma.processingStep.findMany({
      where: {
        completedAt: { gte: thisMonthStart },
        sourceItem: { locationId: warehouseId },
      },
      include: {
        sourceItem: true,
        outputs: { include: { outputItem: true } },
      },
    }),
    prisma.processingStep.findMany({
      where: {
        completedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        sourceItem: { locationId: warehouseId },
      },
      include: {
        sourceItem: true,
        outputs: { include: { outputItem: true } },
      },
    }),
  ]);

  function calcWasteCost(steps: typeof thisMonthSteps) {
    let totalWasteCost = 0;
    let totalWasteWeight = 0;
    let totalInputWeight = 0;
    let totalOutputWeight = 0;

    for (const step of steps) {
      const wasteW = Number(step.wasteWeight || 0);
      const inputW = Number(step.inputWeight || 0);
      const outputW = Number(step.outputWeight || 0);
      const sourceCost = Number(step.sourceItem.costRwf || 0);
      const costPerGram = inputW > 0 && sourceCost > 0 ? sourceCost / inputW : 0;

      totalWasteCost += costPerGram * wasteW;
      totalWasteWeight += wasteW;
      totalInputWeight += inputW;
      totalOutputWeight += outputW;
    }

    return {
      wasteCost: Math.round(totalWasteCost),
      wasteWeight: totalWasteWeight,
      inputWeight: totalInputWeight,
      outputWeight: totalOutputWeight,
      wastePct: totalInputWeight > 0 ? Math.round((totalWasteWeight / totalInputWeight) * 1000) / 10 : 0,
      stepCount: steps.length,
    };
  }

  const thisMonth = calcWasteCost(thisMonthSteps);
  const lastMonth = calcWasteCost(lastMonthSteps);

  const costTrend = lastMonth.wasteCost > 0
    ? Math.round(((thisMonth.wasteCost - lastMonth.wasteCost) / lastMonth.wasteCost) * 1000) / 10
    : thisMonth.wasteCost > 0 ? 100 : 0;

  const weightTrend = lastMonth.wasteWeight > 0
    ? Math.round(((thisMonth.wasteWeight - lastMonth.wasteWeight) / lastMonth.wasteWeight) * 1000) / 10
    : thisMonth.wasteWeight > 0 ? 100 : 0;

  // ── 2. Waste by Category with Cost ──────────────────────────────────────

  const allRecentSteps = await prisma.processingStep.findMany({
    where: {
      completedAt: { gte: threeMonthsAgo },
      sourceItem: { locationId: warehouseId },
    },
    include: {
      sourceItem: { include: { category: true } },
    },
  });

  const categoryMap = new Map<string, {
    name: string;
    inputWeight: number;
    outputWeight: number;
    wasteWeight: number;
    wasteCost: number;
    stepCount: number;
  }>();

  for (const step of allRecentSteps) {
    const catName = step.sourceItem.category.name;
    const entry = categoryMap.get(catName) || {
      name: catName,
      inputWeight: 0,
      outputWeight: 0,
      wasteWeight: 0,
      wasteCost: 0,
      stepCount: 0,
    };

    const wasteW = Number(step.wasteWeight || 0);
    const inputW = Number(step.inputWeight || 0);
    const outputW = Number(step.outputWeight || 0);
    const sourceCost = Number(step.sourceItem.costRwf || 0);
    const costPerGram = inputW > 0 && sourceCost > 0 ? sourceCost / inputW : 0;

    entry.inputWeight += inputW;
    entry.outputWeight += outputW;
    entry.wasteWeight += wasteW;
    entry.wasteCost += costPerGram * wasteW;
    entry.stepCount += 1;
    categoryMap.set(catName, entry);
  }

  const wasteByCategory = Array.from(categoryMap.values())
    .map((cat) => ({
      ...cat,
      wasteCost: Math.round(cat.wasteCost),
      wastePct: cat.inputWeight > 0
        ? Math.round((cat.wasteWeight / cat.inputWeight) * 1000) / 10
        : 0,
      yieldPct: cat.inputWeight > 0
        ? Math.round((cat.outputWeight / cat.inputWeight) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.wasteCost - a.wasteCost);

  // ── 3. Staff Yield Performance ──────────────────────────────────────────

  const staffMap = new Map<string, {
    userId: string;
    name: string;
    totalInputWeight: number;
    totalOutputWeight: number;
    totalWasteWeight: number;
    totalWasteCost: number;
    stepCount: number;
  }>();

  // Need performer info
  const stepsWithPerformer = await prisma.processingStep.findMany({
    where: {
      completedAt: { gte: threeMonthsAgo },
      sourceItem: { locationId: warehouseId },
    },
    include: {
      sourceItem: true,
      performer: { select: { id: true, name: true } },
    },
  });

  for (const step of stepsWithPerformer) {
    const entry = staffMap.get(step.performedBy) || {
      userId: step.performedBy,
      name: step.performer.name,
      totalInputWeight: 0,
      totalOutputWeight: 0,
      totalWasteWeight: 0,
      totalWasteCost: 0,
      stepCount: 0,
    };

    const wasteW = Number(step.wasteWeight || 0);
    const inputW = Number(step.inputWeight || 0);
    const outputW = Number(step.outputWeight || 0);
    const sourceCost = Number(step.sourceItem.costRwf || 0);
    const costPerGram = inputW > 0 && sourceCost > 0 ? sourceCost / inputW : 0;

    entry.totalInputWeight += inputW;
    entry.totalOutputWeight += outputW;
    entry.totalWasteWeight += wasteW;
    entry.totalWasteCost += costPerGram * wasteW;
    entry.stepCount += 1;
    staffMap.set(step.performedBy, entry);
  }

  const staffPerformance = Array.from(staffMap.values())
    .map((s) => ({
      ...s,
      totalWasteCost: Math.round(s.totalWasteCost),
      avgYieldPct: s.totalInputWeight > 0
        ? Math.round((s.totalOutputWeight / s.totalInputWeight) * 1000) / 10
        : 0,
      wastePct: s.totalInputWeight > 0
        ? Math.round((s.totalWasteWeight / s.totalInputWeight) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.stepCount - a.stepCount);

  // ── 4. True Cost Analysis ───────────────────────────────────────────────
  // For received items that have been processed, compare:
  // purchase price per kg vs effective price per kg (purchase / usable output weight)

  const processedRoots = await prisma.inventoryItem.findMany({
    where: {
      locationId: warehouseId,
      status: { in: ["PROCESSED", "PACKAGED"] },
      costRwf: { not: null },
      weightGrams: { not: null },
      parentItemId: null, // root items only
    },
    include: {
      category: true,
      childItems: {
        where: { status: { not: "WASTE" } },
        select: { weightGrams: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const trueCostAnalysis = processedRoots
    .map((item) => {
      const purchaseCost = Number(item.costRwf || 0);
      const purchaseWeight = Number(item.weightGrams || 0);
      const usableOutputWeight = item.childItems.reduce(
        (sum, child) => sum + Number(child.weightGrams || 0),
        0
      );

      const purchasePricePerKg = purchaseWeight > 0
        ? Math.round((purchaseCost / (purchaseWeight / 1000)) * 100) / 100
        : 0;
      const effectivePricePerKg = usableOutputWeight > 0
        ? Math.round((purchaseCost / (usableOutputWeight / 1000)) * 100) / 100
        : 0;
      const costInflation = purchasePricePerKg > 0
        ? Math.round(((effectivePricePerKg - purchasePricePerKg) / purchasePricePerKg) * 1000) / 10
        : 0;

      return {
        itemId: item.id,
        name: item.name,
        category: item.category.name,
        purchaseCost,
        purchaseWeightGrams: purchaseWeight,
        usableOutputWeightGrams: usableOutputWeight,
        wasteWeightGrams: purchaseWeight - usableOutputWeight,
        purchasePricePerKg,
        effectivePricePerKg,
        costInflation,
      };
    })
    .filter((item) => item.usableOutputWeightGrams > 0);

  // ── 5. Weekly Trends (last 12 weeks) ────────────────────────────────────

  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

  const trendSteps = await prisma.processingStep.findMany({
    where: {
      completedAt: { gte: twelveWeeksAgo },
      sourceItem: { locationId: warehouseId },
    },
    include: { sourceItem: true },
    orderBy: { completedAt: "asc" },
  });

  const weeklyMap = new Map<string, {
    week: string;
    wasteWeight: number;
    wasteCost: number;
    inputWeight: number;
    stepCount: number;
  }>();

  for (const step of trendSteps) {
    if (!step.completedAt) continue;

    const d = new Date(step.completedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

    const entry = weeklyMap.get(weekKey) || {
      week: weekKey,
      wasteWeight: 0,
      wasteCost: 0,
      inputWeight: 0,
      stepCount: 0,
    };

    const wasteW = Number(step.wasteWeight || 0);
    const inputW = Number(step.inputWeight || 0);
    const sourceCost = Number(step.sourceItem.costRwf || 0);
    const costPerGram = inputW > 0 && sourceCost > 0 ? sourceCost / inputW : 0;

    entry.wasteWeight += wasteW;
    entry.wasteCost += costPerGram * wasteW;
    entry.inputWeight += inputW;
    entry.stepCount += 1;
    weeklyMap.set(weekKey, entry);
  }

  const weeklyTrends = Array.from(weeklyMap.values())
    .map((w) => ({
      ...w,
      wasteCost: Math.round(w.wasteCost),
      wastePct: w.inputWeight > 0
        ? Math.round((w.wasteWeight / w.inputWeight) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return NextResponse.json({
    summary: {
      thisMonth,
      lastMonth,
      costTrend,
      weightTrend,
    },
    wasteByCategory,
    staffPerformance,
    trueCostAnalysis,
    weeklyTrends,
  });
}

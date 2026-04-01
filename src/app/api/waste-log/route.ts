import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;
  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30")));
  const perPage = 20;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where = {
    status: "WASTE" as const,
    createdAt: { gte: since },
    ...(categoryId ? { categoryId } : {}),
  };

  const [items, total, stats, categoryStats] = await Promise.all([
    // Waste items with context
    prisma.inventoryItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        parentItem: { select: { name: true, batchCode: true } },
        stepOutputs: {
          take: 1,
          include: {
            processingStep: {
              select: {
                stepType: true,
                inputWeight: true,
                wasteWeight: true,
                performer: { select: { name: true } },
                startedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),

    // Total count
    prisma.inventoryItem.count({ where }),

    // Aggregate stats for the period
    prisma.inventoryItem.aggregate({
      where: { status: "WASTE", createdAt: { gte: since } },
      _sum: { weightGrams: true },
      _count: true,
    }),

    // Top waste categories
    prisma.inventoryItem.groupBy({
      by: ["categoryId"],
      where: { status: "WASTE", createdAt: { gte: since } },
      _sum: { weightGrams: true },
      _count: true,
      orderBy: { _sum: { weightGrams: "desc" } },
      take: 5,
    }),
  ]);

  // Look up category names for the top waste categories
  const catIds = categoryStats.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Total items processed in the period for waste percentage
  const totalProcessed = await prisma.inventoryItem.count({
    where: { createdAt: { gte: since } },
  });

  return NextResponse.json({
    items: items.map((item) => {
      const step = item.stepOutputs[0]?.processingStep;
      return {
        id: item.id,
        name: item.name,
        batchCode: item.batchCode,
        weightGrams: item.weightGrams ? Number(item.weightGrams) : 0,
        createdAt: item.createdAt.toISOString(),
        category: item.category,
        parentItem: item.parentItem,
        step: step
          ? {
              stepType: step.stepType,
              inputWeight: step.inputWeight ? Number(step.inputWeight) : 0,
              wasteWeight: step.wasteWeight ? Number(step.wasteWeight) : 0,
              performerName: step.performer.name,
              startedAt: step.startedAt.toISOString(),
            }
          : null,
      };
    }),
    total,
    totalPages: Math.ceil(total / perPage),
    stats: {
      totalWasteGrams: Number(stats._sum.weightGrams || 0),
      totalWasteItems: stats._count,
      wastePercentage:
        totalProcessed > 0
          ? Math.round((stats._count / totalProcessed) * 1000) / 10
          : 0,
      topCategories: categoryStats.map((c) => ({
        categoryId: c.categoryId,
        categoryName: catMap[c.categoryId] || "Unknown",
        totalGrams: Number(c._sum.weightGrams || 0),
        count: c._count,
      })),
    },
  });
}

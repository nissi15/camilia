import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireDualAuth(req);
  if (error) return error;

  const categoryId = req.nextUrl.searchParams.get("categoryId");

  // Get all non-waste, non-dispatched items grouped by category
  const where: Record<string, unknown> = {
    status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] },
  };
  if (categoryId) where.categoryId = categoryId;

  const items = await prisma.inventoryItem.findMany({
    where,
    include: { category: true, supplierRef: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by category
  const categoryMap: Record<string, {
    categoryId: string;
    categoryName: string;
    totalWeight: number;
    totalCount: number;
    items: typeof items;
    expiringCount: number;
  }> = {};

  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const item of items) {
    const catId = item.categoryId;
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        categoryId: catId,
        categoryName: item.category.name,
        totalWeight: 0,
        totalCount: 0,
        items: [],
        expiringCount: 0,
      };
    }
    categoryMap[catId].totalWeight += Number(item.weightGrams || 0);
    categoryMap[catId].totalCount += item.unitCount;
    categoryMap[catId].items.push(item);
    if (item.expiresAt && item.expiresAt <= threeDays) {
      categoryMap[catId].expiringCount++;
    }
  }

  // Get par levels for comparison
  const parLevels = await prisma.parLevel.findMany({
    include: { restaurant: true },
  });

  const stockLevels = Object.values(categoryMap).map((cat) => {
    const parTotal = parLevels
      .filter((p) => p.categoryId === cat.categoryId)
      .reduce((sum, p) => sum + p.parQuantity, 0);

    return {
      ...cat,
      items: undefined, // Don't send all items in the summary
      itemCount: cat.items.length,
      parTotal,
      belowPar: parTotal > 0 && cat.totalCount < parTotal,
    };
  });

  return NextResponse.json(stockLevels);
}

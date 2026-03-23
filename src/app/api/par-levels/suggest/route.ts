import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireDualAuth(req);
  if (error) return error;

  const restaurantId = req.nextUrl.searchParams.get("restaurantId");
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  // Look at last 30 days of fulfilled request items for this restaurant
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentItems = await prisma.requestItem.findMany({
    where: {
      request: {
        restaurantId,
        status: "DELIVERED",
        deliveredAt: { gte: thirtyDaysAgo },
      },
      status: "FULFILLED",
    },
    select: {
      categoryId: true,
      quantity: true,
      unitLabel: true,
    },
  });

  // Aggregate by category
  const categoryTotals: Record<string, { total: number; unitLabel: string }> = {};
  for (const item of recentItems) {
    if (!item.categoryId) continue;
    if (!categoryTotals[item.categoryId]) {
      categoryTotals[item.categoryId] = { total: 0, unitLabel: item.unitLabel };
    }
    categoryTotals[item.categoryId].total += item.quantity;
  }

  // Calculate weekly average * 1.2 safety buffer
  const suggestions = Object.entries(categoryTotals).map(([categoryId, data]) => {
    const weeklyAverage = data.total / 4.3; // ~4.3 weeks in 30 days
    const suggested = Math.ceil(weeklyAverage * 1.2);
    return {
      categoryId,
      suggestedQuantity: Math.max(suggested, 1),
      unitLabel: data.unitLabel,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
    };
  });

  return NextResponse.json(suggestions);
}

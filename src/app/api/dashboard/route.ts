import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;
  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [totalStock, pendingRequests, processedToday, wasteItems, totalItems, recentRequests, recentSteps] =
    await Promise.all([
      // Total active stock items
      prisma.inventoryItem.count({
        where: {
          status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] },
        },
      }),
      // Pending requests
      prisma.request.count({
        where: { status: "PENDING" },
      }),
      // Processed today
      prisma.processingStep.count({
        where: {
          startedAt: { gte: startOfDay },
        },
      }),
      // Waste items this week
      prisma.inventoryItem.count({
        where: {
          status: "WASTE",
          createdAt: { gte: startOfWeek },
        },
      }),
      // Total items this week (for waste %)
      prisma.inventoryItem.count({
        where: {
          createdAt: { gte: startOfWeek },
        },
      }),
      // Recent pending/packing requests
      prisma.request.findMany({
        where: { status: { in: ["PENDING", "PACKING"] } },
        include: {
          restaurant: true,
          _count: { select: { items: true } },
        },
        orderBy: { requestedAt: "desc" },
        take: 5,
      }),
      // Recent processing steps for activity feed
      prisma.processingStep.findMany({
        include: {
          sourceItem: true,
          performer: true,
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

  const wastePercentage = totalItems > 0 ? (wasteItems / totalItems) * 100 : 0;

  return NextResponse.json({
    totalStock,
    pendingRequests,
    processedToday,
    wastePercentage,
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      restaurantName: r.restaurant.name,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      itemCount: r._count.items,
    })),
    recentActivity: recentSteps.map((s) => ({
      id: s.id,
      description: `${s.performer.name} ${s.stepType.toLowerCase()}ed "${s.sourceItem.name}"`,
      timestamp: s.startedAt.toISOString(),
      type: s.stepType,
    })),
  });
}

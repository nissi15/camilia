import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;
  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const warehouseId = user!.locationId;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // Get restaurant IDs linked to this warehouse via conversations
  const linkedRestaurants = await prisma.conversation.findMany({
    where: { warehouseId: warehouseId! },
    select: { restaurantId: true },
  });
  const linkedRestaurantIds = linkedRestaurants.map((c) => c.restaurantId);

  const [totalStock, pendingRequests, processedToday, wasteItems, totalItems, recentRequests, recentSteps] =
    await Promise.all([
      // Total active stock items at this warehouse
      prisma.inventoryItem.count({
        where: {
          locationId: warehouseId!,
          status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] },
        },
      }),
      // Pending requests from linked restaurants
      prisma.request.count({
        where: { status: "PENDING", restaurantId: { in: linkedRestaurantIds } },
      }),
      // Processed today at this warehouse
      prisma.processingStep.count({
        where: {
          startedAt: { gte: startOfDay },
          sourceItem: { locationId: warehouseId! },
        },
      }),
      // Waste items this week at this warehouse
      prisma.inventoryItem.count({
        where: {
          locationId: warehouseId!,
          status: "WASTE",
          createdAt: { gte: startOfWeek },
        },
      }),
      // Total items this week at this warehouse (for waste %)
      prisma.inventoryItem.count({
        where: {
          locationId: warehouseId!,
          createdAt: { gte: startOfWeek },
        },
      }),
      // Recent pending/packing requests from linked restaurants
      prisma.request.findMany({
        where: { status: { in: ["PENDING", "PACKING"] }, restaurantId: { in: linkedRestaurantIds } },
        include: {
          restaurant: true,
          _count: { select: { items: true } },
        },
        orderBy: { requestedAt: "desc" },
        take: 5,
      }),
      // Recent processing steps at this warehouse
      prisma.processingStep.findMany({
        where: { sourceItem: { locationId: warehouseId! } },
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

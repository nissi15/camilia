import { NextRequest, NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const warehouseId = session!.user.locationId!;
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100));

  // Only show dispatches for restaurants linked to this warehouse
  const linkedRestaurants = await prisma.conversation.findMany({
    where: { warehouseId },
    select: { restaurantId: true },
  });
  const linkedRestaurantIds = linkedRestaurants.map((c) => c.restaurantId);

  const [dispatches, total] = await Promise.all([
    prisma.request.findMany({
      where: {
        status: { in: ["DISPATCHED", "DELIVERED"] },
        restaurantId: { in: linkedRestaurantIds },
      },
      include: {
        restaurant: true,
        items: true,
      },
      orderBy: { dispatchedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.request.count({
      where: {
        status: { in: ["DISPATCHED", "DELIVERED"] },
        restaurantId: { in: linkedRestaurantIds },
      },
    }),
  ]);

  return NextResponse.json({
    dispatches: dispatches.map((d) => ({
      id: d.id,
      requestNumber: d.requestNumber,
      restaurant: d.restaurant.name,
      status: d.status,
      itemCount: d.items.length,
      dispatchedAt: d.dispatchedAt?.toISOString(),
      deliveredAt: d.deliveredAt?.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

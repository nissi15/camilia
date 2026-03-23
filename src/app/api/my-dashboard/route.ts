import { NextResponse } from "next/server";
import { requireRestaurantStaff } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, session } = await requireRestaurantStaff();
  if (error) return error;

  const locationId = session!.user.locationId;
  if (!locationId) {
    return NextResponse.json({ error: "No location assigned" }, { status: 400 });
  }

  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [activeRequests, deliveredThisWeek, recentRequests] = await Promise.all([
    prisma.request.count({
      where: {
        restaurantId: locationId,
        status: { in: ["PENDING", "PACKING", "DISPATCHED"] },
      },
    }),
    prisma.request.count({
      where: {
        restaurantId: locationId,
        status: "DELIVERED",
        deliveredAt: { gte: startOfWeek },
      },
    }),
    prisma.request.findMany({
      where: { restaurantId: locationId },
      include: { _count: { select: { items: true } } },
      orderBy: { requestedAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    activeRequests,
    deliveredThisWeek,
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      itemCount: r._count.items,
    })),
  });
}

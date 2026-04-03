import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Scope inventory search based on role — always filter by location
  const inventoryWhere: Record<string, unknown> = {
    locationId: session!.user.locationId!,
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { batchCode: { contains: q, mode: "insensitive" } },
    ],
  };

  // Scope requests search based on role
  const requestsWhere: Record<string, unknown> = {
    OR: [
      { requestNumber: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ],
  };

  if (session!.user.role === "RESTAURANT_STAFF") {
    requestsWhere.restaurantId = session!.user.locationId;
  } else {
    // Warehouse admin: only search requests from linked restaurants
    const linkedRestaurants = await prisma.conversation.findMany({
      where: { warehouseId: session!.user.locationId! },
      select: { restaurantId: true },
    });
    requestsWhere.restaurantId = { in: linkedRestaurants.map((c) => c.restaurantId) };
  }

  const [inventory, requests] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: inventoryWhere,
      select: {
        id: true,
        name: true,
        batchCode: true,
        status: true,
        category: { select: { name: true } },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.request.findMany({
      where: requestsWhere,
      select: {
        id: true,
        requestNumber: true,
        status: true,
        priority: true,
        notes: true,
        restaurant: { select: { name: true } },
        requestedAt: true,
      },
      take: 5,
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ inventory, requests });
}

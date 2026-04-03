import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      restaurant: true,
      requester: true,
      items: {
        include: {
          category: true,
          fulfilledItem: true,
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Restaurant staff can only see their own requests
  if (user!.role === "RESTAURANT_STAFF" && request.restaurantId !== user!.locationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Warehouse admin can only see requests from linked restaurants
  if (user!.role === "WAREHOUSE_ADMIN") {
    const link = await prisma.conversation.findFirst({
      where: { warehouseId: user!.locationId!, restaurantId: request.restaurantId },
    });
    if (!link) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(request);
}

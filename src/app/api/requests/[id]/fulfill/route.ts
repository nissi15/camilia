import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const warehouseId = session!.user.locationId!;
  const { id } = await params;
  const body = await req.json();
  const { itemId, fulfilledItemId, status } = body;

  // Verify the request belongs to a linked restaurant
  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  const link = await prisma.conversation.findFirst({
    where: { warehouseId, restaurantId: request.restaurantId },
  });
  if (!link) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // itemId = the request item id
  // fulfilledItemId = the inventory item assigned
  // status = FULFILLED or UNAVAILABLE

  const requestItem = await prisma.requestItem.findUnique({
    where: { id: itemId },
  });

  if (!requestItem || requestItem.requestId !== id) {
    return NextResponse.json({ error: "Request item not found" }, { status: 404 });
  }

  const updated = await prisma.requestItem.update({
    where: { id: itemId },
    data: {
      fulfilledItemId: fulfilledItemId || null,
      status: status || "FULFILLED",
    },
  });

  // If fulfilled, update the inventory item status to DISPATCHED
  if (fulfilledItemId && status === "FULFILLED") {
    await prisma.inventoryItem.update({
      where: { id: fulfilledItemId },
      data: { status: "DISPATCHED" },
    });
  }

  return NextResponse.json(updated);
}

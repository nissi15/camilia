import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { itemId, fulfilledItemId, status } = body;

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

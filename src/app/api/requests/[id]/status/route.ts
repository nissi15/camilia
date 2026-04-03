import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/telegram/notify";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PACKING", "CANCELLED"],
  PACKING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, dispatchPhotoUrl } = body;

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Verify this request is from a restaurant linked to this admin's warehouse
  const link = await prisma.conversation.findFirst({
    where: { warehouseId: user!.locationId!, restaurantId: request.restaurantId },
  });
  if (!link) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[request.status];
  if (!allowed || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${request.status} to ${status}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "PACKING") updateData.packedAt = new Date();
  if (status === "DISPATCHED") {
    updateData.dispatchedAt = new Date();
    if (dispatchPhotoUrl) updateData.dispatchPhotoUrl = dispatchPhotoUrl;
  }
  if (status === "DELIVERED") updateData.deliveredAt = new Date();

  const updated = await prisma.request.update({
    where: { id },
    data: updateData,
    include: { restaurant: true, requester: true, items: true },
  });

  // Notify the restaurant staff who made the request
  const statusLabels: Record<string, string> = {
    PACKING: "is being packed",
    DISPATCHED: "has been dispatched",
    DELIVERED: "has been delivered",
    CANCELLED: "has been cancelled",
  };

  await notifyUser(updated.requestedBy, {
    type: "REQUEST_STATUS_CHANGED",
    title: `Request ${statusLabels[status] || "updated"}`,
    body: `${updated.requestNumber} ${statusLabels[status] || `status changed to ${status}`}`,
    href: `/my-requests/${updated.id}`,
  });

  return NextResponse.json(updated);
}

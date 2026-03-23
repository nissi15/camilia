import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { notifyWarehouseAdmins } from "@/lib/telegram/notify";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "RESTAURANT_STAFF") {
    return NextResponse.json({ error: "Only restaurant staff can confirm delivery" }, { status: 403 });
  }

  const { id } = await params;

  let body: { notes?: string; deliveryPhotoUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    // No body or invalid JSON is fine — notes are optional
  }

  const request = await prisma.request.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.restaurantId !== user!.locationId) {
    return NextResponse.json(
      { error: "This request does not belong to your location" },
      { status: 403 }
    );
  }

  if (request.status !== "DISPATCHED") {
    return NextResponse.json(
      { error: `Cannot confirm delivery — request status is ${request.status}, expected DISPATCHED` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    status: "DELIVERED",
    deliveredAt: new Date(),
  };
  if (body.deliveryPhotoUrl) {
    updateData.deliveryPhotoUrl = body.deliveryPhotoUrl;
  }
  if (body.notes) {
    updateData.notes = request.notes
      ? `${request.notes}\n\nDelivery notes: ${body.notes}`
      : `Delivery notes: ${body.notes}`;
  }

  const updated = await prisma.request.update({
    where: { id },
    data: updateData,
    include: { restaurant: true, items: true },
  });

  // Notify all warehouse admins
  await notifyWarehouseAdmins({
    type: "DELIVERY_CONFIRMED",
    title: "Delivery Confirmed",
    body: `${request.restaurant.name} confirmed delivery of ${request.requestNumber}`,
    href: `/requests/${request.id}`,
  });

  return NextResponse.json(updated);
}

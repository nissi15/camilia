import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRestaurantSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

export async function GET() {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const warehouseId = session!.user.locationId!;

  // Only return restaurants linked to this warehouse via conversations
  const linkedRestaurants = await prisma.conversation.findMany({
    where: { warehouseId },
    select: { restaurantId: true },
  });
  const linkedIds = linkedRestaurants.map((c) => c.restaurantId);

  const restaurants = await prisma.location.findMany({
    where: { type: "RESTAURANT", id: { in: linkedIds } },
    include: {
      users: {
        select: { id: true, name: true, email: true },
      },
      _count: { select: { requestsFrom: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(restaurants);
}

export async function POST(req: Request) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const warehouseId = session!.user.locationId!;

  const body = await req.json();
  const parsed = createRestaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, address, phone } = parsed.data;

  const restaurant = await prisma.location.create({
    data: {
      name,
      type: "RESTAURANT",
      address: address || null,
      phone: phone || null,
    },
  });

  // Link this restaurant to the current admin's warehouse via a conversation
  await prisma.conversation.create({
    data: {
      restaurantId: restaurant.id,
      warehouseId,
    },
  }).catch(() => {
    // Ignore if conversation already exists
  });

  return NextResponse.json(restaurant, { status: 201 });
}

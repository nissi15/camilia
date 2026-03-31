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

  // Return all restaurants (for this warehouse admin's context)
  const restaurants = await prisma.location.findMany({
    where: { type: "RESTAURANT" },
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
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

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

  // Also create a conversation between this restaurant and the admin's warehouse
  const admin = await prisma.user.findFirst({
    where: { role: "WAREHOUSE_ADMIN" },
    select: { locationId: true },
  });

  if (admin?.locationId) {
    await prisma.conversation.create({
      data: {
        restaurantId: restaurant.id,
        warehouseId: admin.locationId,
      },
    }).catch(() => {
      // Ignore if conversation already exists
    });
  }

  return NextResponse.json(restaurant, { status: 201 });
}

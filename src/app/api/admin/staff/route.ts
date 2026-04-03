import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  restaurantId: z.string().min(1),
});

export async function POST(req: Request) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const warehouseId = session!.user.locationId!;

  const body = await req.json();
  const parsed = createStaffSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, restaurantId } = parsed.data;

  // Verify restaurant exists and is linked to this warehouse
  const restaurant = await prisma.location.findUnique({
    where: { id: restaurantId, type: "RESTAURANT" },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const link = await prisma.conversation.findFirst({
    where: { restaurantId, warehouseId },
  });
  if (!link) {
    return NextResponse.json({ error: "Restaurant not linked to your warehouse" }, { status: 403 });
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "RESTAURANT_STAFF",
      locationId: restaurantId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      location: { select: { name: true } },
    },
  });

  return NextResponse.json(user, { status: 201 });
}

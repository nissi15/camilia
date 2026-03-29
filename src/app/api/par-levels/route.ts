import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const parLevelSchema = z.object({
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1),
  parQuantity: z.number().int().positive(),
  unitLabel: z.string().default("piece"),
});

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  // Restaurant staff can only see their own par levels
  // Warehouse admin can see all or filter by restaurantId
  let restaurantId: string | null = null;
  if (user!.role === "RESTAURANT_STAFF") {
    restaurantId = user!.locationId!;
  } else {
    restaurantId = req.nextUrl.searchParams.get("restaurantId") || null;
  }

  const parLevels = await prisma.parLevel.findMany({
    where: restaurantId ? { restaurantId } : {},
    include: {
      category: true,
      restaurant: true,
    },
    orderBy: { category: { name: "asc" } },
  });

  return NextResponse.json(parLevels);
}

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parLevelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const parLevel = await prisma.parLevel.upsert({
    where: {
      restaurantId_categoryId: {
        restaurantId: parsed.data.restaurantId,
        categoryId: parsed.data.categoryId,
      },
    },
    update: {
      parQuantity: parsed.data.parQuantity,
      unitLabel: parsed.data.unitLabel,
    },
    create: parsed.data,
    include: { category: true, restaurant: true },
  });

  return NextResponse.json(parLevel);
}

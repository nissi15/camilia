import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1),
  items: z.array(z.object({
    categoryId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitLabel: z.string().default("piece"),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  // Restaurant staff can only see their own templates
  // Warehouse admin can see all or filter by restaurantId
  let restaurantId: string | null = null;
  if (user!.role === "RESTAURANT_STAFF") {
    restaurantId = user!.locationId!;
  } else {
    restaurantId = req.nextUrl.searchParams.get("restaurantId") || null;
  }

  const templates = await prisma.requestTemplate.findMany({
    where: restaurantId ? { restaurantId } : {},
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "RESTAURANT_STAFF" || !user!.locationId) {
    return NextResponse.json({ error: "Only restaurant staff can create templates" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = templateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.requestTemplate.create({
    data: {
      name: parsed.data.name,
      restaurantId: user!.locationId,
      items: parsed.data.items,
    },
  });

  return NextResponse.json(template, { status: 201 });
}

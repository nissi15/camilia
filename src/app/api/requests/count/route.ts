import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  const where: Record<string, unknown> = {
    status: { in: ["PENDING", "PACKING"] },
  };

  // Restaurant staff only sees their own
  if (user!.role === "RESTAURANT_STAFF") {
    where.restaurantId = user!.locationId;
  }

  const pendingCount = await prisma.request.count({ where });

  return NextResponse.json({ pendingCount });
}

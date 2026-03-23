import { NextRequest, NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const [dispatches, total] = await Promise.all([
    prisma.request.findMany({
      where: { status: { in: ["DISPATCHED", "DELIVERED"] } },
      include: {
        restaurant: true,
        items: true,
      },
      orderBy: { dispatchedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.request.count({
      where: { status: { in: ["DISPATCHED", "DELIVERED"] } },
    }),
  ]);

  return NextResponse.json({
    dispatches: dispatches.map((d) => ({
      id: d.id,
      requestNumber: d.requestNumber,
      restaurant: d.restaurant.name,
      status: d.status,
      itemCount: d.items.length,
      dispatchedAt: d.dispatchedAt?.toISOString(),
      deliveredAt: d.deliveredAt?.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

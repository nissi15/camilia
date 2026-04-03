import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;
  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100));

  const where: Record<string, unknown> = {};

  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { batchCode: { contains: search, mode: "insensitive" } },
    ];
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.receivedAt = dateFilter;
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

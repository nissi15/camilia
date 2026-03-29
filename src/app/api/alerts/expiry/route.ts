import { NextRequest, NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const days = Math.max(1, Math.min(parseInt(searchParams.get("days") || "7") || 7, 365));

  const now = new Date();
  const criticalThreshold = new Date(now);
  criticalThreshold.setDate(criticalThreshold.getDate() + 2);
  const warningThreshold = new Date(now);
  warningThreshold.setDate(warningThreshold.getDate() + days);

  // Fetch all items with expiration dates up to the warning threshold
  // that are still active in the warehouse
  const items = await prisma.inventoryItem.findMany({
    where: {
      locationId: session!.user.locationId!,
      expiresAt: { lte: warningThreshold },
      status: { notIn: ["WASTE", "DISPATCHED", "DELIVERED"] },
    },
    select: {
      id: true,
      name: true,
      batchCode: true,
      expiresAt: true,
      status: true,
      category: {
        select: { name: true },
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  const expired: typeof items = [];
  const critical: typeof items = [];
  const warning: typeof items = [];

  for (const item of items) {
    if (!item.expiresAt) continue;

    if (item.expiresAt <= now) {
      expired.push(item);
    } else if (item.expiresAt <= criticalThreshold) {
      critical.push(item);
    } else {
      warning.push(item);
    }
  }

  return NextResponse.json({
    expired,
    critical,
    warning,
    summary: {
      expiredCount: expired.length,
      criticalCount: critical.length,
      warningCount: warning.length,
      total: items.length,
    },
  });
}

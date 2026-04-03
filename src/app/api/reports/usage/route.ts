import { NextRequest, NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const days = Math.max(1, Math.min(parseInt(searchParams.get("days") || "30") || 30, 365));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const steps = await prisma.processingStep.findMany({
    where: {
      startedAt: { gte: since },
      stepType: { not: "RECEIVE" },
      sourceItem: { locationId: session!.user.locationId! },
    },
    include: {
      sourceItem: { include: { category: true } },
    },
    orderBy: { startedAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<string, { date: string; count: number; weight: number }>();

  steps.forEach((step) => {
    const date = step.startedAt.toISOString().split("T")[0];
    const existing = dateMap.get(date) || { date, count: 0, weight: 0 };
    existing.count += 1;
    existing.weight += Number(step.inputWeight || 0);
    dateMap.set(date, existing);
  });

  return NextResponse.json(Array.from(dateMap.values()));
}

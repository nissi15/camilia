import { NextRequest, NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  // Get processing steps with waste
  const steps = await prisma.processingStep.findMany({
    where: {
      ...where,
      wasteWeight: { gt: 0 },
    },
    include: {
      sourceItem: {
        include: { category: true },
      },
    },
  });

  // Aggregate by category
  const categoryMap = new Map<string, { name: string; inputWeight: number; outputWeight: number; wasteWeight: number }>();

  steps.forEach((step) => {
    const catName = step.sourceItem.category.name;
    const existing = categoryMap.get(catName) || { name: catName, inputWeight: 0, outputWeight: 0, wasteWeight: 0 };
    existing.inputWeight += Number(step.inputWeight || 0);
    existing.outputWeight += Number(step.outputWeight || 0);
    existing.wasteWeight += Number(step.wasteWeight || 0);
    categoryMap.set(catName, existing);
  });

  const data = Array.from(categoryMap.values()).map((cat) => ({
    ...cat,
    wastePercentage: cat.inputWeight > 0 ? (cat.wasteWeight / cat.inputWeight) * 100 : 0,
  }));

  return NextResponse.json(data);
}

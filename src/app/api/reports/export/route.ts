import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const type = req.nextUrl.searchParams.get("type") || "waste";
  const days = Math.max(1, Math.min(parseInt(req.nextUrl.searchParams.get("days") || "30") || 30, 365));

  const since = new Date();
  since.setDate(since.getDate() - days);

  if (type === "waste") {
    const wasteItems = await prisma.inventoryItem.findMany({
      where: {
        status: "WASTE",
        createdAt: { gte: since },
      },
      include: { category: true, parentItem: true },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = ["Date", "Item", "Category", "Waste (g)", "Parent Item", "Lot Number"];
    const rows = wasteItems.map((item) => [
      item.createdAt.toISOString().split("T")[0],
      item.name,
      item.category.name,
      String(item.weightGrams || 0),
      item.parentItem?.name || "",
      item.parentItem?.lotNumber || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="waste-report-${days}d.csv"`,
      },
    });
  }

  if (type === "yield") {
    const steps = await prisma.processingStep.findMany({
      where: {
        completedAt: { gte: since },
        stepType: { in: ["BUTCHER", "PORTION", "PACKAGE"] },
      },
      include: {
        sourceItem: { include: { category: true } },
        performer: true,
      },
      orderBy: { completedAt: "desc" },
    });

    const headers = ["Date", "Staff", "Category", "Input (g)", "Output (g)", "Waste (g)", "Yield %"];
    const rows = steps.map((step) => {
      const input = Number(step.inputWeight || 0);
      const output = Number(step.outputWeight || 0);
      const yieldPct = input > 0 ? ((output / input) * 100).toFixed(1) : "0";
      return [
        step.completedAt?.toISOString().split("T")[0] || "",
        step.performer.name,
        step.sourceItem.category.name,
        String(input),
        String(output),
        String(step.wasteWeight || 0),
        yieldPct,
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="yield-report-${days}d.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}

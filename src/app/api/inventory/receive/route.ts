import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { receiveItemSchema } from "@/lib/validators/inventory";
import { generateBatchCode, generateLotNumber } from "@/lib/constants";

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = receiveItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Get category name for batch code
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  // Use the admin's own warehouse location
  const warehouseId = user!.locationId;
  if (!warehouseId) {
    return NextResponse.json({ error: "No warehouse assigned to your account" }, { status: 400 });
  }

  // Resolve supplier
  let supplierId: string | null = null;
  let supplierName = data.supplier || "Unknown";
  if (data.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (supplier) {
      supplierId = supplier.id;
      supplierName = supplier.name;
    }
  }

  const batchCode = generateBatchCode(category.name);
  const lotNumber = generateLotNumber(supplierName);

  const item = await prisma.inventoryItem.create({
    data: {
      batchCode,
      categoryId: data.categoryId,
      name: data.name,
      status: "RECEIVED",
      weightGrams: data.weightGrams,
      unitCount: data.unitCount,
      unitLabel: data.unitLabel,
      locationId: warehouseId,
      supplierId,
      supplier: supplierName,
      lotNumber,
      costRwf: data.costRwf,
      photoUrl: data.photoUrl,
      receivedAt: new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes,
    },
    include: { category: true, supplierRef: true },
  });

  // Create a RECEIVE processing step for audit trail
  await prisma.processingStep.create({
    data: {
      sourceItemId: item.id,
      stepType: "RECEIVE",
      performedBy: user!.id,
      inputWeight: data.weightGrams,
      outputWeight: data.weightGrams,
      inputCount: data.unitCount,
      outputCount: data.unitCount,
      photoUrl: data.photoUrl,
      notes: `Received from ${supplierName}`,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(item, { status: 201 });
}

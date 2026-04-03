import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { processStepSchema } from "@/lib/validators/processing";
import { generateBatchCode, calcYieldPercent } from "@/lib/constants";

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = processStepSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Get the source item
  const sourceItem = await prisma.inventoryItem.findUnique({
    where: { id: data.sourceItemId },
    include: { category: true },
  });

  if (!sourceItem) {
    return NextResponse.json({ error: "Source item not found" }, { status: 404 });
  }

  // Ensure the item belongs to this admin's warehouse
  if (sourceItem.locationId !== user!.locationId) {
    return NextResponse.json({ error: "Item does not belong to your warehouse" }, { status: 403 });
  }

  // Validate: source must be in a processable status
  if (!["RECEIVED", "PROCESSED", "IN_PROCESSING"].includes(sourceItem.status)) {
    return NextResponse.json(
      { error: `Cannot process item with status ${sourceItem.status}` },
      { status: 400 }
    );
  }

  // Validate weight conservation: outputs + waste <= input
  if (sourceItem.weightGrams) {
    const inputWeight = Number(sourceItem.weightGrams);
    const totalOutputWeight = data.outputs.reduce(
      (sum, o) => sum + (o.weightGrams || 0),
      0
    );
    const totalWeight = totalOutputWeight + data.wasteWeight;

    if (totalWeight > inputWeight * 1.01) {
      // 1% tolerance for rounding
      return NextResponse.json(
        {
          error: `Output weight (${totalOutputWeight}g) + waste (${data.wasteWeight}g) exceeds input weight (${inputWeight}g)`,
        },
        { status: 400 }
      );
    }
  }

  // Get yield target for comparison
  const yieldTarget = await prisma.yieldTarget.findUnique({
    where: {
      categoryId_stepType: {
        categoryId: sourceItem.categoryId,
        stepType: data.stepType,
      },
    },
  });

  const rootItemId = sourceItem.rootItemId || sourceItem.id;

  // Execute everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create processing step
    const totalOutputWeight = data.outputs.reduce(
      (sum, o) => sum + (o.weightGrams || 0),
      0
    );

    const step = await tx.processingStep.create({
      data: {
        sourceItemId: data.sourceItemId,
        stepType: data.stepType,
        stepLabel: data.stepLabel,
        performedBy: user!.id,
        inputWeight: sourceItem.weightGrams,
        outputWeight: totalOutputWeight,
        wasteWeight: data.wasteWeight,
        inputCount: sourceItem.unitCount,
        outputCount: data.outputs.reduce((sum, o) => sum + o.unitCount, 0),
        photoUrl: data.photoUrl,
        notes: data.notes,
        completedAt: new Date(),
      },
    });

    // 2. Create output items
    const outputItems = [];
    for (const output of data.outputs) {
      const category = await tx.category.findUnique({
        where: { id: output.categoryId },
      });

      const outputItem = await tx.inventoryItem.create({
        data: {
          batchCode: generateBatchCode(category?.name || "ITEM"),
          categoryId: output.categoryId,
          name: output.name,
          status: data.stepType === "PACKAGE" ? "PACKAGED" : "PROCESSED",
          weightGrams: output.weightGrams,
          unitCount: output.unitCount,
          unitLabel: output.unitLabel,
          parentItemId: sourceItem.id,
          rootItemId: rootItemId,
          locationId: sourceItem.locationId,
          receivedAt: sourceItem.receivedAt,
          expiresAt: sourceItem.expiresAt,
          supplierId: sourceItem.supplierId,
          supplier: sourceItem.supplier,
          lotNumber: sourceItem.lotNumber,
        },
      });

      // 3. Link output to processing step
      await tx.processingStepOutput.create({
        data: {
          processingStepId: step.id,
          outputItemId: outputItem.id,
        },
      });

      outputItems.push(outputItem);
    }

    // 4. Create waste item if applicable
    if (data.wasteWeight > 0) {
      const wasteItem = await tx.inventoryItem.create({
        data: {
          batchCode: generateBatchCode("WASTE"),
          categoryId: sourceItem.categoryId,
          name: `Waste from ${sourceItem.name}`,
          status: "WASTE",
          weightGrams: data.wasteWeight,
          unitCount: 1,
          unitLabel: "waste",
          parentItemId: sourceItem.id,
          rootItemId: rootItemId,
          locationId: sourceItem.locationId,
        },
      });

      await tx.processingStepOutput.create({
        data: {
          processingStepId: step.id,
          outputItemId: wasteItem.id,
        },
      });
    }

    // 5. Update source item status
    await tx.inventoryItem.update({
      where: { id: sourceItem.id },
      data: { status: "PROCESSED" },
    });

    return { step, outputItems };
  });

  // Calculate yield info for response
  const inputWeight = Number(sourceItem.weightGrams || 0);
  const outputWeight = Number(result.step.outputWeight || 0);
  const yieldPercent = calcYieldPercent(inputWeight, outputWeight);
  const targetPercent = yieldTarget ? Number(yieldTarget.targetPercent) : null;

  return NextResponse.json({
    ...result,
    yield: {
      actual: yieldPercent,
      target: targetPercent,
      deviation: targetPercent ? yieldPercent - targetPercent : null,
      belowTarget: targetPercent ? yieldPercent < targetPercent : false,
    },
  }, { status: 201 });
}

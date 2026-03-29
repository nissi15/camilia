import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      parentItem: { include: { category: true } },
      childItems: { include: { category: true } },
      processingStepsAsSource: {
        include: {
          performer: true,
          outputs: {
            include: { outputItem: { include: { category: true } } },
          },
        },
        orderBy: { startedAt: "asc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  // Validate string fields
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.length > 200)) {
    return NextResponse.json({ error: "Name must be a string of 200 characters or less" }, { status: 400 });
  }
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 1000)) {
    return NextResponse.json({ error: "Notes must be a string of 1000 characters or less" }, { status: 400 });
  }
  if (body.supplier !== undefined && (typeof body.supplier !== "string" || body.supplier.length > 200)) {
    return NextResponse.json({ error: "Supplier must be a string of 200 characters or less" }, { status: 400 });
  }
  if (body.expiresAt !== undefined) {
    const parsed = new Date(body.expiresAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid expiresAt date" }, { status: 400 });
    }
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: body.name,
      notes: body.notes,
      supplier: body.supplier,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    },
  });

  return NextResponse.json(item);
}

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

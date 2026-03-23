import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      parentId: body.parentId,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;

  // Check if category has items
  const itemCount = await prisma.inventoryItem.count({
    where: { categoryId: id },
  });

  if (itemCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with inventory items" },
      { status: 400 }
    );
  }

  // Check if category has children
  const childCount = await prisma.category.count({
    where: { parentId: id },
  });

  if (childCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with subcategories" },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

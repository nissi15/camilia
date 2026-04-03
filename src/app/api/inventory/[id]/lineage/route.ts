import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireWarehouseAdmin();
  if (error) return error;

  const { id } = await params;

  // Get the item to find its root — scoped to this warehouse
  const item = await prisma.inventoryItem.findUnique({
    where: { id, locationId: session!.user.locationId! },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const rootId = item.rootItemId || item.id;

  // Get all items in the lineage tree
  const lineageItems = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { id: rootId },
        { rootItemId: rootId },
      ],
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(lineageItems);
}

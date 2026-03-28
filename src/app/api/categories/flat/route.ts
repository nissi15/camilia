import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";

// Returns a flat list of all categories (useful for dropdowns)
export async function GET(req: NextRequest) {
  const { error } = await requireDualAuth(req);
  if (error) return error;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentId: true },
  });

  return NextResponse.json(categories);
}

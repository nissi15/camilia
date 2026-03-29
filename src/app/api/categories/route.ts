import { NextResponse } from "next/server";
import { requireAuth, requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const categories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    where: { parentId: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, parentId, description } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or less" }, { status: 400 });
  }

  if (description && typeof description === "string" && description.length > 500) {
    return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name, parentId: parentId || null, description },
  });

  return NextResponse.json(category, { status: 201 });
}

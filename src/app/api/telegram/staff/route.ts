import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      linkCode: true,
      telegramLink: {
        select: { telegramName: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

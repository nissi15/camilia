import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * POST: Unlink a user's Telegram account (admin only).
 * This allows re-linking to a different Telegram account.
 */
export async function POST(req: Request) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const link = await prisma.telegramLink.findUnique({ where: { userId } });
  if (!link) {
    return NextResponse.json({ error: "User is not linked to Telegram" }, { status: 400 });
  }

  await prisma.telegramLink.delete({ where: { userId } });

  return NextResponse.json({ message: "Telegram account unlinked" });
}

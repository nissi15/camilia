import { NextResponse } from "next/server";
import { requireWarehouseAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { generateLinkCode } from "@/lib/constants";

/**
 * POST: Generate a link code for a user (admin only).
 * This code is given to the staff member to enter in Telegram.
 */
export async function POST(req: Request) {
  const { error } = await requireWarehouseAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already linked
  const existing = await prisma.telegramLink.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "User already linked to Telegram", linked: true }, { status: 400 });
  }

  // Generate a new link code
  const code = generateLinkCode();
  await prisma.user.update({
    where: { id: userId },
    data: { linkCode: code },
  });

  return NextResponse.json({ code, userName: user.name });
}

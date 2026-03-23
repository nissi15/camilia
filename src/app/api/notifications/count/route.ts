import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session!.user.id,
      readAt: null,
    },
  });

  return NextResponse.json({ unreadCount });
}

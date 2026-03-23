import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { ids, all } = body as { ids?: string[]; all?: boolean };

  if (!all && (!ids || !Array.isArray(ids) || ids.length === 0)) {
    return NextResponse.json(
      { error: "Provide either { ids: string[] } or { all: true }" },
      { status: 400 }
    );
  }

  const now = new Date();

  if (all) {
    const result = await prisma.notification.updateMany({
      where: {
        userId: session!.user.id,
        readAt: null,
      },
      data: { readAt: now },
    });

    return NextResponse.json({ updated: result.count });
  }

  // Mark only the specified notifications as read (owned by current user)
  const result = await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session!.user.id,
      readAt: null,
    },
    data: { readAt: now },
  });

  return NextResponse.json({ updated: result.count });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check access
  const user = session!.user;
  if (
    user.role === "RESTAURANT_STAFF" &&
    conversation.restaurantId !== user.locationId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { conversationId } = await params;
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = session!.user;
  if (
    user.role === "RESTAURANT_STAFF" &&
    conversation.restaurantId !== user.locationId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      content: content.trim(),
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}

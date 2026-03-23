import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = session!.user;
  const locationId = user.locationId;

  let conversations;

  if (user.role === "WAREHOUSE_ADMIN") {
    // Warehouse sees all conversations
    conversations = await prisma.conversation.findMany({
      include: {
        restaurant: true,
        warehouse: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: user.id } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Restaurant staff sees only their conversation
    conversations = await prisma.conversation.findMany({
      where: { restaurantId: locationId! },
      include: {
        restaurant: true,
        warehouse: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: user.id } },
            },
          },
        },
      },
    });
  }

  return NextResponse.json(
    conversations.map((c) => ({
      id: c.id,
      restaurantName: c.restaurant.name,
      warehouseName: c.warehouse.name,
      lastMessage: c.messages[0] || null,
      unreadCount: c._count.messages,
    }))
  );
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100));
  const filter = searchParams.get("filter"); // "read" | "unread" | null (all)

  const where: Record<string, unknown> = {
    userId: session!.user.id,
  };

  if (filter === "unread") {
    where.readAt = null;
  } else if (filter === "read") {
    where.readAt = { not: null };
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session!.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (session!.user.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json(
      { error: "Only warehouse admins can create notifications" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { userId, type, title, body: notifBody, href } = body;

  if (!userId || !type || !title || !notifBody) {
    return NextResponse.json(
      { error: "Missing required fields: userId, type, title, body" },
      { status: 400 }
    );
  }

  if (typeof title !== "string" || title.length > 200) {
    return NextResponse.json({ error: "Title must be a string of 200 characters or less" }, { status: 400 });
  }

  if (typeof notifBody !== "string" || notifBody.length > 1000) {
    return NextResponse.json({ error: "Body must be a string of 1000 characters or less" }, { status: 400 });
  }

  if (href && (typeof href !== "string" || href.length > 500)) {
    return NextResponse.json({ error: "href must be a string of 500 characters or less" }, { status: 400 });
  }

  const validTypes = [
    "EXPIRY_WARNING",
    "LOW_STOCK",
    "REQUEST_CREATED",
    "REQUEST_STATUS_CHANGED",
    "DELIVERY_CONFIRMED",
    "NEW_MESSAGE",
    "SYSTEM",
  ];

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body: notifBody,
      href: href || null,
    },
  });

  return NextResponse.json(notification, { status: 201 });
}

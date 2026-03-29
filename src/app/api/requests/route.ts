import { NextRequest, NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validators/requests";
import { generateRequestNumber } from "@/lib/constants";
import { notifyWarehouseAdmins } from "@/lib/telegram/notify";
import { InlineKeyboard } from "grammy";

export async function GET(req: NextRequest) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100));

    const where: Record<string, unknown> = {};

    // Restaurant staff only sees their own requests
    if (user!.role === "RESTAURANT_STAFF") {
      where.restaurantId = user!.locationId;
    }

    if (status && status !== "ALL") {
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
      }
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          restaurant: true,
          requester: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { items: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/requests error:", err);
    return NextResponse.json({ requests: [], total: 0, page: 1, totalPages: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "RESTAURANT_STAFF") {
    return NextResponse.json({ error: "Only restaurant staff can create requests" }, { status: 403 });
  }

  const locationId = user!.locationId;
  if (!locationId) {
    return NextResponse.json({ error: "No location assigned" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const request = await prisma.request.create({
    data: {
      requestNumber: generateRequestNumber(),
      requestedBy: user!.id,
      restaurantId: locationId,
      priority: data.priority,
      notes: data.notes,
      templateId: data.templateId,
      items: {
        create: data.items.map((item) => ({
          categoryId: item.categoryId || null,
          description: item.description,
          quantity: item.quantity,
          unitLabel: item.unitLabel,
        })),
      },
    },
    include: {
      items: true,
      restaurant: true,
    },
  });

  // Build item summary for notification
  const itemSummary = request.items.map((i) => `${i.quantity}x ${i.description}`).join(", ");

  // Notify warehouse admins via both in-app and Telegram
  const keyboard = new InlineKeyboard()
    .text("Approve", `approve:${request.id}`)
    .text("Reject", `reject:${request.id}`);

  const admins = await prisma.user.findMany({
    where: { role: "WAREHOUSE_ADMIN" },
    select: { id: true },
  });

  for (const admin of admins) {
    const { notifyUser } = await import("@/lib/telegram/notify");
    await notifyUser(admin.id, {
      type: "REQUEST_CREATED",
      title: "New Request",
      body: `${request.restaurant.name}: ${request.requestNumber} (${data.priority})`,
      href: `/requests/${request.id}`,
      telegramText:
        `<b>New Request</b>\n\n` +
        `<b>From:</b> ${request.restaurant.name}\n` +
        `<b>Number:</b> ${request.requestNumber}\n` +
        `<b>Priority:</b> ${data.priority}\n` +
        `<b>Items:</b> ${itemSummary}\n` +
        (data.notes ? `<b>Notes:</b> ${data.notes}` : ""),
      telegramKeyboard: keyboard,
    });
  }

  return NextResponse.json(request, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, miniAppButton } from "./bot";
import { InlineKeyboard } from "grammy";

/**
 * Send a notification to a user via Telegram (if linked) and create in-app notification.
 */
export async function notifyUser(
  userId: string,
  opts: {
    type: string;
    title: string;
    body: string;
    href?: string;
    telegramText?: string;
    telegramKeyboard?: InlineKeyboard;
  }
) {
  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: opts.type as "REQUEST_CREATED" | "REQUEST_STATUS_CHANGED" | "DELIVERY_CONFIRMED" | "LOW_STOCK" | "EXPIRY_WARNING" | "NEW_MESSAGE" | "SYSTEM",
      title: opts.title,
      body: opts.body,
      href: opts.href,
    },
  });

  // Send Telegram message if user is linked
  const link = await prisma.telegramLink.findUnique({
    where: { userId },
  });

  if (link) {
    const text = opts.telegramText || `<b>${opts.title}</b>\n${opts.body}`;
    const keyboard = opts.telegramKeyboard || (opts.href ? miniAppButton(opts.href) : undefined);
    await sendTelegramMessage(link.telegramId, text, keyboard);
  }
}

/**
 * Send notification to all warehouse admins
 */
export async function notifyWarehouseAdmins(opts: {
  type: string;
  title: string;
  body: string;
  href?: string;
  telegramText?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "WAREHOUSE_ADMIN" },
    select: { id: true },
  });

  await Promise.all(admins.map((admin) => notifyUser(admin.id, opts)));
}

/**
 * Send notification to restaurant staff at a location
 */
export async function notifyRestaurantStaff(locationId: string, opts: {
  type: string;
  title: string;
  body: string;
  href?: string;
  telegramText?: string;
}) {
  const staff = await prisma.user.findMany({
    where: { role: "RESTAURANT_STAFF", locationId },
    select: { id: true },
  });

  await Promise.all(staff.map((s) => notifyUser(s.id, opts)));
}

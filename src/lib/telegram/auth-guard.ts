import { NextResponse } from "next/server";
import { validateInitData } from "./validate";
import { prisma } from "@/lib/prisma";

export interface TelegramAuthResult {
  error: NextResponse | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    locationId: string | null;
    locationName: string | null;
    telegramId: number;
  } | null;
}

/**
 * Extract and validate Telegram initData from the Authorization header.
 * Header format: "tma <initData>"
 */
export async function requireTelegramAuth(req: Request): Promise<TelegramAuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("tma ")) {
    return {
      error: NextResponse.json({ error: "Missing Telegram authorization" }, { status: 401 }),
      user: null,
    };
  }

  const initDataStr = authHeader.slice(4);
  const initData = validateInitData(initDataStr);

  if (!initData) {
    return {
      error: NextResponse.json({ error: "Invalid Telegram authorization" }, { status: 401 }),
      user: null,
    };
  }

  // Look up linked user
  const link = await prisma.telegramLink.findUnique({
    where: { telegramId: BigInt(initData.user.id) },
    include: {
      user: {
        include: { location: true },
      },
    },
  });

  if (!link) {
    return {
      error: NextResponse.json({ error: "Telegram account not linked" }, { status: 403 }),
      user: null,
    };
  }

  return {
    error: null,
    user: {
      id: link.user.id,
      email: link.user.email,
      name: link.user.name,
      role: link.user.role,
      locationId: link.user.locationId,
      locationName: link.user.location?.name ?? null,
      telegramId: initData.user.id,
    },
  };
}

/**
 * Dual auth: try NextAuth session first, fall back to Telegram initData
 */
export async function requireDualAuth(req: Request) {
  // Try Telegram auth from header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("tma ")) {
    return requireTelegramAuth(req);
  }

  // Fall back to NextAuth (server-side)
  const { requireAuth } = await import("@/lib/auth-guard");
  const result = await requireAuth();

  if (result.error) {
    return { error: result.error, user: null };
  }

  return {
    error: null,
    user: {
      id: result.session!.user.id,
      email: result.session!.user.email,
      name: result.session!.user.name,
      role: result.session!.user.role,
      locationId: result.session!.user.locationId,
      locationName: result.session!.user.locationName,
      telegramId: 0,
    },
  };
}

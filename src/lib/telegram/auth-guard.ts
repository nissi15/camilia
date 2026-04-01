import { NextResponse } from "next/server";
import { validateInitData } from "./validate";
import { verifySessionToken } from "./session-token";
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
 * Extract and validate Telegram auth from the Authorization header.
 * Supports two schemes:
 *   - "tma <initData>"       — standard Telegram initData (24-hour window)
 *   - "tma-session <token>"  — long-lived session token (30 days)
 */
export async function requireTelegramAuth(req: Request): Promise<TelegramAuthResult> {
  const authHeader = req.headers.get("authorization");

  // ── Scheme 1: Telegram initData ──
  if (authHeader?.startsWith("tma ")) {
    const initDataStr = authHeader.slice(4);
    const initData = validateInitData(initDataStr);

    if (!initData) {
      return {
        error: NextResponse.json({ error: "Invalid Telegram authorization" }, { status: 401 }),
        user: null,
      };
    }

    const link = await prisma.telegramLink.findUnique({
      where: { telegramId: BigInt(initData.user.id) },
      include: { user: { include: { location: true } } },
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

  // ── Scheme 2: Session token ──
  if (authHeader?.startsWith("tma-session ")) {
    const token = authHeader.slice(12);
    const parsed = verifySessionToken(token);

    if (!parsed) {
      return {
        error: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
        user: null,
      };
    }

    // Verify the link still exists (handles revocation via unlink)
    const link = await prisma.telegramLink.findUnique({
      where: { telegramId: BigInt(parsed.telegramId) },
      include: { user: { include: { location: true } } },
    });

    if (!link || link.userId !== parsed.userId) {
      return {
        error: NextResponse.json({ error: "Session revoked" }, { status: 401 }),
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
        telegramId: parsed.telegramId,
      },
    };
  }

  return {
    error: NextResponse.json({ error: "Missing Telegram authorization" }, { status: 401 }),
    user: null,
  };
}

/**
 * Dual auth: try Telegram auth (initData or session), fall back to NextAuth
 */
export async function requireDualAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("tma ") || authHeader?.startsWith("tma-session ")) {
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

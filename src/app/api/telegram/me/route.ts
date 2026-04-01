import { NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/telegram/auth-guard";
import { createSessionToken } from "@/lib/telegram/session-token";

export async function GET(req: Request) {
  const { error, user } = await requireTelegramAuth(req);
  if (error) return error;

  // Issue a long-lived session token so the user stays logged in
  const sessionToken = createSessionToken(user!.id, user!.telegramId);

  return NextResponse.json({
    ...user,
    sessionToken,
  });
}

import { NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/telegram/auth-guard";

export async function GET(req: Request) {
  const { error, user } = await requireTelegramAuth(req);
  if (error) return error;

  return NextResponse.json(user);
}

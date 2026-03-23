import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  return session;
}

export async function requireWarehouseAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "WAREHOUSE_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireRestaurantStaff() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RESTAURANT_STAFF") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

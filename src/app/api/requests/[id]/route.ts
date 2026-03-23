import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      restaurant: true,
      requester: true,
      items: {
        include: {
          category: true,
          fulfilledItem: true,
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Restaurant staff can only see their own requests
  if (
    session!.user.role === "RESTAURANT_STAFF" &&
    request.restaurantId !== session!.user.locationId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(request);
}

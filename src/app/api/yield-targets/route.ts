import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const yieldTargetSchema = z.object({
  categoryId: z.string().min(1),
  stepType: z.enum(["BUTCHER", "PORTION", "PACKAGE", "CUSTOM"]),
  targetPercent: z.number().min(0).max(100),
});

export async function GET(req: Request) {
  const { error } = await requireDualAuth(req);
  if (error) return error;

  const targets = await prisma.yieldTarget.findMany({
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  return NextResponse.json(targets);
}

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  if (user!.role !== "WAREHOUSE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = yieldTargetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.yieldTarget.upsert({
    where: {
      categoryId_stepType: {
        categoryId: parsed.data.categoryId,
        stepType: parsed.data.stepType,
      },
    },
    update: { targetPercent: parsed.data.targetPercent },
    create: parsed.data,
    include: { category: true },
  });

  return NextResponse.json(target);
}

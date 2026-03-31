import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  warehouseName: z.string().min(2).max(100),
  warehouseAddress: z.string().max(200).optional(),
  warehousePhone: z.string().max(30).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, warehouseName, warehouseAddress, warehousePhone } = parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  // Create warehouse location + admin user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const warehouse = await tx.location.create({
      data: {
        name: warehouseName,
        type: "WAREHOUSE",
        address: warehouseAddress || null,
        phone: warehousePhone || null,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "WAREHOUSE_ADMIN",
        locationId: warehouse.id,
      },
    });

    return { user, warehouse };
  });

  return NextResponse.json(
    {
      message: "Registration successful",
      userId: result.user.id,
      warehouseId: result.warehouse.id,
    },
    { status: 201 }
  );
}

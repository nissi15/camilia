import { NextResponse } from "next/server";
import { requireDualAuth } from "@/lib/telegram/auth-guard";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";

export async function POST(req: Request) {
  const { error, user } = await requireDualAuth(req);
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const context = (formData.get("context") as string) || "general";
  const entityId = (formData.get("entityId") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${allowedMimeTypes.join(", ")}` },
      { status: 400 }
    );
  }

  if (context.length > 50 || entityId.length > 100) {
    return NextResponse.json({ error: "Invalid context or entityId length" }, { status: 400 });
  }

  const url = await saveUploadedFile(file, context);

  const photo = await prisma.photo.create({
    data: {
      url,
      context,
      entityId,
      uploadedBy: user!.id,
    },
  });

  return NextResponse.json({ photoId: photo.id, url }, { status: 201 });
}

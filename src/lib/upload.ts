import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Save an uploaded file to disk and return the public URL.
 * In production, replace this with S3/R2 upload.
 */
export async function saveUploadedFile(
  file: File,
  context: string
): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${context}-${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  // Try to compress with sharp if it's an image
  try {
    const sharp = (await import("sharp")).default;
    const compressed = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const jpgFilename = `${context}-${uuidv4()}.jpg`;
    const jpgPath = path.join(UPLOAD_DIR, jpgFilename);
    await fs.writeFile(jpgPath, compressed);
    return `/uploads/${jpgFilename}`;
  } catch {
    // Not an image or sharp failed, save as-is
    await fs.writeFile(filepath, buffer);
    return `/uploads/${filename}`;
  }
}

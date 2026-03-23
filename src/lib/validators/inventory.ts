import { z } from "zod";

export const receiveItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  weightGrams: z.number().positive("Weight must be positive").optional(),
  unitCount: z.number().int().positive("Count must be at least 1").default(1),
  unitLabel: z.string().default("piece"),
  supplier: z.string().optional(),
  supplierId: z.string().optional(),
  costRwf: z.number().min(0).optional(),
  photoUrl: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceiveItemInput = z.infer<typeof receiveItemSchema>;

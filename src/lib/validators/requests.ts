import { z } from "zod";

const requestItemSchema = z.object({
  categoryId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitLabel: z.string().default("piece"),
});

export const createRequestSchema = z.object({
  items: z.array(requestItemSchema).min(1, "At least one item required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  notes: z.string().optional(),
  templateId: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

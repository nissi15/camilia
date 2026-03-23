import { z } from "zod";

const outputItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  weightGrams: z.number().positive("Weight must be positive").optional(),
  unitCount: z.number().int().positive().default(1),
  unitLabel: z.string().default("piece"),
  categoryId: z.string().min(1, "Category is required"),
});

export const processStepSchema = z.object({
  sourceItemId: z.string().min(1),
  stepType: z.enum(["BUTCHER", "PORTION", "PACKAGE", "CUSTOM"]),
  stepLabel: z.string().optional(),
  outputs: z.array(outputItemSchema).min(1, "At least one output required"),
  wasteWeight: z.number().min(0).default(0),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type ProcessStepInput = z.infer<typeof processStepSchema>;
export type OutputItemInput = z.infer<typeof outputItemSchema>;

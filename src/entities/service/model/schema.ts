import { z } from "zod";

export const serviceCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters/digits/dashes"),
  name: z.string().trim().min(2),
  category: z.enum(["DIAGNOSTIC", "ONCOLOGY"]),
  description: z.string().trim().optional(),
  prepInstructions: z.string().trim().optional(),
  defaultDurationMin: z.coerce.number().int().min(5).default(30),
  supportsSeries: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial().omit({ slug: true });

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

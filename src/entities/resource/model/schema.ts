import { z } from "zod";

export const resourceCreateSchema = z.object({
  centreId: z.string().min(1),
  name: z.string().trim().min(2),
  type: z.string().trim().min(2),
  isActive: z.coerce.boolean().default(true),
});

export const resourceUpdateSchema = resourceCreateSchema.partial().omit({ centreId: true });

export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;

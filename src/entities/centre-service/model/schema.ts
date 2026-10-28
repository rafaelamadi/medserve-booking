import { z } from "zod";

export const centreServiceUpsertSchema = z.object({
  centreId: z.string().min(1),
  serviceId: z.string().min(1),
  resourceId: z.string().trim().optional(),
  confirmationMode: z.enum(["AUTO", "REVIEW"]).default("REVIEW"),
  slotMinutes: z.coerce.number().int().min(5).default(30),
  capacityPerSlot: z.coerce.number().int().min(1).default(1),
  resultInstruction: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

export type CentreServiceUpsertInput = z.infer<typeof centreServiceUpsertSchema>;

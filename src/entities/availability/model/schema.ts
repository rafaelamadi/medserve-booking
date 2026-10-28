import { z } from "zod";

export const availabilityRuleSchema = z.object({
  centreServiceId: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startMinute: z.coerce.number().int().min(0).max(1439),
  endMinute: z.coerce.number().int().min(1).max(1440),
});

export const closureSchema = z.object({
  centreId: z.string().min(1),
  /** empty string = whole centre; otherwise a resource id */
  resourceId: z.string().trim().optional().default(""),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  reason: z.string().trim().optional(),
});

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type ClosureInput = z.infer<typeof closureSchema>;

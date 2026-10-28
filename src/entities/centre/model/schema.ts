import { z } from "zod";

export const centreCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters/digits (e.g. MLCC)"),
  name: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  address: z.string().trim().optional(),
  phone: z.string().trim().min(5),
  timezone: z.string().trim().default("Africa/Lagos"),
  cancelCutoffHours: z.coerce.number().int().min(0).default(24),
  maxPatientReschedules: z.coerce.number().int().min(0).default(2),
  minLeadMinutes: z.coerce.number().int().min(0).default(120),
  bookingWindowDays: z.coerce.number().int().min(1).default(90),
  resultNudgeDays: z.coerce.number().int().min(1).default(5),
  isActive: z.coerce.boolean().default(true),
});

export const centreUpdateSchema = centreCreateSchema.partial().omit({ code: true });

export type CentreCreateInput = z.infer<typeof centreCreateSchema>;
export type CentreUpdateInput = z.infer<typeof centreUpdateSchema>;

import { z } from "zod";

/** FR-B2: no clinical details collected. Consent required (PRD §14). */
export const bookingSubmitSchema = z.object({
  centreId: z.string().min(1),
  centreServiceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(5, "Phone is required"),
  email: z.string().trim().optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  consent: z.literal(true, { message: "Consent is required" }),
  /** Bot challenge (FR-B10): honeypot must stay empty. */
  company: z.string().max(0, "Bot detected").optional().default(""),
  /** Bot challenge: ms timestamp when the form was opened; must be >2s old. */
  startedAt: z.coerce.number(),
});

export type BookingSubmitInput = z.infer<typeof bookingSubmitSchema>;

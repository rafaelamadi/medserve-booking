import { z } from "zod";

export const holidayCreateSchema = z.object({
  /** empty string = global (all centres); otherwise a centre id */
  centreId: z.string().trim().optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  name: z.string().trim().min(2),
});

export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;

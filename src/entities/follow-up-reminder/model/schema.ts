import { z } from "zod";

/** FR-F1: staff-scheduled follow-up reminder (e.g. 12 months for annual screening). */
export const followUpScheduleSchema = z.object({
  centreId: z.string().min(1),
  serviceId: z.string().min(1),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  appointmentId: z.string().min(1).optional(),
  patientId: z.string().min(1).optional(),
});

export type FollowUpScheduleInput = z.infer<typeof followUpScheduleSchema>;

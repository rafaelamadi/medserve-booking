import z from "zod";

export const clinicalAppointmentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  patientName: z.string(),
  patientPhone: z.string(),
  patientEmail: z.string().optional(),
  patientMrn: z.string(),
  centreId: z.string(),
  centreCode: z.string(),
  centreName: z.string(),
  serviceName: z.string(),
  modality: z.string(),
  fractionInfo: z.string().optional(),
  scheduledTime: z.string(),
  timeSlot: z.string(),
  room: z.string(),
  status: z.string(),
  oncologist: z.string(),
  triageNotes: z.string().optional(),
  rescheduleReason: z.string().optional(),
});

export type ClinicalAppointmentRow = z.infer<typeof clinicalAppointmentSchema>;

// Alias for backwards compatibility if needed
export type RecentCustomerRow = ClinicalAppointmentRow;

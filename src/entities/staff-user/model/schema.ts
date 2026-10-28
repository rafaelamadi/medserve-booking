import { z } from "zod";

export const staffInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2),
  role: z.enum(["SUPER_ADMIN", "CENTRE_MANAGER", "CLINICIAN", "STAFF", "VIEWER"]),
  centreIds: z.array(z.string().min(1)).default([]),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

"use server";

import { getStaffSession, requireRole } from "@/shared/lib/auth";
import { sendResultNoticeService } from "./service";

type Result = { ok: true } | { ok: false; error: string };

/** FR-R1: "Result ready" on a COMPLETED visit → generic notice (FR-R2), one record. */
export async function sendResultNoticeAction(appointmentId: string): Promise<Result> {
  const s = await getStaffSession();
  if (!s) return { ok: false, error: "Unauthorized" };
  try {
    await requireRole("STAFF");
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  return sendResultNoticeService(appointmentId, {
    staffId: s.staffId,
    role: s.role,
    centreIds: s.centreIds,
  });
}

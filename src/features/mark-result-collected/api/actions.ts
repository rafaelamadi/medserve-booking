"use server";

import { getStaffSession, requireRole } from "@/shared/lib/auth";
import { markResultCollectedService } from "./service";

type Result = { ok: true } | { ok: false; error: string };

/** FR-R3: mark a result notice collected. */
export async function markResultCollectedAction(noticeId: string): Promise<Result> {
  const s = await getStaffSession();
  if (!s) return { ok: false, error: "Unauthorized" };
  try {
    await requireRole("STAFF");
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  return markResultCollectedService(noticeId, {
    staffId: s.staffId,
    role: s.role,
    centreIds: s.centreIds,
  });
}

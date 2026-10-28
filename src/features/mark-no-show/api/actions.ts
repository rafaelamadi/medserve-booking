"use server";

import type { Prisma } from "@prisma/client";
import { transitionAppointment } from "@/entities/appointment";
import { enqueueNotification } from "@/entities/notification";
import { getStaffSession, requireRole } from "@/shared/lib/auth";

type Result = { ok: true; reference: string } | { ok: false; error: string };

/** FR-H3: mark a no-show (series sessions raise a manager alert in Phase 5). */
export async function markNoShowAction(id: string): Promise<Result> {
  try {
    const s = await getStaffSession();
    if (!s) throw new Error("Unauthorized");
    await requireRole("STAFF");
    const r = await transitionAppointment({
      id,
      kind: "noshow",
      staffId: s.staffId,
      scopeCentreIds: s.role === "SUPER_ADMIN" ? null : s.centreIds,
      notify: (tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) =>
        enqueueNotification(tx, n),
    });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

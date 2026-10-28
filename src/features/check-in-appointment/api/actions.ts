"use server";

import type { Prisma } from "@prisma/client";
import { transitionAppointment } from "@/entities/appointment";
import { refreshSeriesStatusForAppointment } from "@/entities/care-series/api/maintenance";
import { enqueueNotification } from "@/entities/notification";
import { getStaffSession, requireRole } from "@/shared/lib/auth";

type Result = { ok: true; reference: string } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

async function staffScope() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  await requireRole("STAFF");
  return { staffId: s.staffId, scope: s.role === "SUPER_ADMIN" ? null : s.centreIds };
}

function notify(tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) {
  return enqueueNotification(tx, n);
}

/** FR-H3: check in an arrived patient. */
export async function checkInAppointmentAction(id: string): Promise<Result> {
  try {
    const { staffId, scope } = await staffScope();
    const r = await transitionAppointment({ id, kind: "checkin", staffId, scopeCentreIds: scope, notify });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

/** FR-H3: complete a visit (enables result notices in Phase 6). */
export async function completeAppointmentAction(id: string): Promise<Result> {
  try {
    const { staffId, scope } = await staffScope();
    const r = await transitionAppointment({ id, kind: "complete", staffId, scopeCentreIds: scope, notify });
    // Close out the parent series when its last session completes (FR-S).
    await refreshSeriesStatusForAppointment(id);
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

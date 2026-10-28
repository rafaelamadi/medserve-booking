"use server";

import type { Prisma } from "@prisma/client";
import { transitionAppointment } from "@/entities/appointment";
import { enqueueNotification } from "@/entities/notification";
import { getStaffSession } from "@/shared/lib/auth";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true; reference: string } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

async function staffScope() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  await requireRole("STAFF"); // VIEWER is read-only
  return { staffId: s.staffId, scope: s.role === "SUPER_ADMIN" ? null : s.centreIds };
}

function notify(tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) {
  return enqueueNotification(tx, n);
}

/** FR-H3: confirm a REQUESTED (or reschedule-pending) booking. */
export async function confirmAppointmentAction(id: string): Promise<Result> {
  try {
    const { staffId, scope } = await staffScope();
    const r = await transitionAppointment({ id, kind: "confirm", staffId, scopeCentreIds: scope, notify });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

/** FR-H3: staff cancel with reason. */
export async function cancelAppointmentStaffAction(id: string, reason: string): Promise<Result> {
  try {
    const { staffId, scope } = await staffScope();
    const r = await transitionAppointment({ id, kind: "cancel", staffId, scopeCentreIds: scope, reason, notify });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

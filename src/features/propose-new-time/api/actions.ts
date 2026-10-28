"use server";

import type { Prisma } from "@prisma/client";
import { transitionAppointment } from "@/entities/appointment";
import { localToUtc } from "@/entities/availability";
import { enqueueNotification } from "@/entities/notification";
import { getStaffSession, requireRole } from "@/shared/lib/auth";
import { prisma } from "@/shared/api/prisma";

type Result = { ok: true; reference: string } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

/**
 * FR-H3: staff proposes a new time (centre decision is final, D1).
 * Date/time arrive centre-local; converted with the appointment's centre timezone.
 */
export async function proposeNewTimeAction(
  id: string,
  input: { date: string; time: string; reason?: string },
): Promise<Result> {
  try {
    const s = await getStaffSession();
    if (!s) throw new Error("Unauthorized");
    await requireRole("STAFF");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) {
      throw new Error("Bad date or time");
    }
    const a = await prisma.appointment.findUnique({
      where: { id },
      include: { centre: { select: { timezone: true } } },
    });
    if (!a || a.deletedAt) throw new Error("Appointment not found");
    const [hh, mm] = input.time.split(":").map(Number);
    const newStartsAt = localToUtc(input.date, hh * 60 + mm, a.centre.timezone);
    const r = await transitionAppointment({
      id,
      kind: "propose",
      staffId: s.staffId,
      scopeCentreIds: s.role === "SUPER_ADMIN" ? null : s.centreIds,
      reason: input.reason,
      newStartsAt,
      notify: (tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) =>
        enqueueNotification(tx, n),
    });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

/** FR-H5: approve the patient's requested time (applies it, CONFIRMED). */
export async function approveRescheduleAction(id: string): Promise<Result> {
  try {
    const s = await getStaffSession();
    if (!s) throw new Error("Unauthorized");
    await requireRole("STAFF");
    const r = await transitionAppointment({
      id,
      kind: "approve",
      staffId: s.staffId,
      scopeCentreIds: s.role === "SUPER_ADMIN" ? null : s.centreIds,
      notify: (tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) =>
        enqueueNotification(tx, n),
    });
    return { ok: true, reference: r.reference };
  } catch (e) {
    return fail(e);
  }
}

"use server";

import { prisma } from "@/shared/api/prisma";
import { getSessionPhone } from "@/shared/lib/patientCookie";

const TERMINAL = ["COMPLETED", "NO_SHOW", "CANCELLED"] as const;

/**
 * FR-M2/M5: patient-visible booking detail. Authorised by the OTP session
 * (phone must own the reference). Trusted server callers (services, scripts)
 * may pass an explicit phoneOverride instead of the session.
 */
export async function getManagedBooking(reference: string, phoneOverride?: string) {
  const phone = phoneOverride ?? (await getSessionPhone());
  if (!phone) return { ok: false as const, error: "Sign in with your booking reference first" };
  const a = await prisma.appointment.findUnique({
    where: { reference: reference.trim().toUpperCase() },
    include: {
      patient: { select: { phone: true } },
      centre: true,
      centreService: { include: { service: true } },
      changes: {
        where: { kind: "RESCHEDULE", initiatedBy: "PATIENT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!a || a.deletedAt || a.patient.phone !== phone) {
    return { ok: false as const, error: "Booking not found" };
  }
  const isSeries = a.careSeriesId !== null;
  const terminal = (TERMINAL as readonly string[]).includes(a.status);
  const msLeft = a.startsAt.getTime() - Date.now();
  const withinCutoff = msLeft < a.centre.cancelCutoffHours * 3600_000;
  const reschedulesLeft = Math.max(0, a.centre.maxPatientReschedules - a.patientReschedules);
  return {
    ok: true as const,
    booking: {
      id: a.id,
      reference: a.reference,
      status: a.status,
      startsAt: a.startsAt.toISOString(),
      requestedStartsAt: a.requestedStartsAt.toISOString(),
      centreName: a.centre.name,
      centrePhone: a.centre.phone,
      centreTimezone: a.centre.timezone,
      serviceName: a.centreService.service.name,
      confirmationMode: a.centreService.confirmationMode,
      prepInstructions: a.centreService.service.prepInstructions,
      isSeries,
      terminal,
      canCancel: !isSeries && !terminal && !withinCutoff,
      cancelBlockedReason: isSeries
        ? "Series appointments are managed by the centre — call them to change anything."
        : terminal
          ? "This booking is closed."
          : withinCutoff
            ? `Too close to the time — call ${a.centre.phone} for help.`
            : null,
      canReschedule: !isSeries && !terminal && reschedulesLeft > 0,
      rescheduleBlockedReason: isSeries
        ? "Series appointments are managed by the centre."
        : terminal
          ? "This booking is closed."
          : reschedulesLeft <= 0
            ? `No changes left online — call ${a.centre.phone}.`
            : null,
      reschedulesLeft,
      pendingRequest: a.status === "RESCHEDULE_REQUESTED" ? a.changes[0]?.newStartsAt?.toISOString() ?? null : null,
      centreServiceId: a.centreServiceId,
      dateStr: a.startsAt.toISOString().slice(0, 10),
    },
  };
}

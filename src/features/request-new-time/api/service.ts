import { Prisma } from "@prisma/client";
import { getManagedBooking } from "@/entities/appointment";
import { getAvailableSlots, localToUtc } from "@/entities/availability";
import { enqueueNotification } from "@/entities/notification";
import { prismaDirect } from "@/shared/api/prisma";

export type RequestNewTimeResult =
  | { ok: true; status: "CONFIRMED" | "RESCHEDULE_REQUESTED" }
  | { ok: false; error: string; alternatives?: Array<{ start: string; date: string }> };

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;

/**
 * FR-M4 core (no session inside): see requestNewTimeAction docs.
 * The action wrapper supplies the session phone; scripts/tests pass it explicitly.
 */
export async function requestNewTimeService(
  reference: string,
  phone: string,
  input: { date: string; time: string },
): Promise<RequestNewTimeResult> {
  try {
    if (!phone) return { ok: false, error: "Sign in with your booking reference first" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) {
      return { ok: false, error: "Bad date or time" };
    }
    const managed = await getManagedBooking(reference, phone);
    if (!managed.ok) return managed;
    const b = managed.booking;
    if (!b.canReschedule) {
      return { ok: false, error: b.rescheduleBlockedReason ?? "Cannot change online" };
    }

    const [hh, mm] = input.time.split(":").map(Number);
    if (b.confirmationMode === "REVIEW") {
      // Hold the original slot; staff decide (FR-M4).
      const [rhh, rmm] = input.time.split(":").map(Number);
      await prismaDirect.$transaction(async (tx: Prisma.TransactionClient) => {
        const appt = await tx.appointment.findUnique({
          where: { id: b.id },
          include: { centre: true, patient: true },
        });
        if (!appt || appt.deletedAt) throw new Error("Booking not found");
        if (appt.status === "CANCELLED" || appt.status === "COMPLETED" || appt.status === "NO_SHOW") {
          throw new Error("Booking is closed");
        }
        if (appt.patientReschedules >= appt.centre.maxPatientReschedules) {
          throw new Error("No changes left online");
        }
        const newStartsAt = localToUtc(input.date, rhh * 60 + rmm, appt.centre.timezone);
        await tx.appointment.update({
          where: { id: appt.id },
          data: { status: "RESCHEDULE_REQUESTED", patientReschedules: { increment: 1 } },
        });
        await tx.scheduleChange.create({
          data: {
            appointmentId: appt.id,
            kind: "RESCHEDULE",
            initiatedBy: "PATIENT",
            oldStartsAt: appt.startsAt,
            newStartsAt,
          },
        });
        await tx.auditLog.create({
          data: { actorType: "PATIENT", entityType: "Appointment", entityId: appt.id, action: "request-new-time" },
        });
        await enqueueNotification(tx, {
          appointmentId: appt.id, patientId: appt.patientId,
          templateKey: "RESCHEDULE_REQUEST_RECEIVED", channel: "SMS",
        });
        if (appt.patient.email) {
          await enqueueNotification(tx, {
            appointmentId: appt.id, patientId: appt.patientId,
            templateKey: "RESCHEDULE_REQUEST_RECEIVED", channel: "EMAIL",
          });
        }
      });
      return { ok: true, status: "RESCHEDULE_REQUESTED" };
    }

    // AUTO: apply immediately inside a serialisable transaction.
    try {
      await prismaDirect.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const appt = await tx.appointment.findUnique({
            where: { id: b.id },
            include: { centre: true, centreService: true, patient: true },
          });
          if (!appt) throw new Error("Booking not found");
          if (appt.patientReschedules >= appt.centre.maxPatientReschedules) {
            throw new Error("No changes left online");
          }
          const newStartsAt = localToUtc(input.date, hh * 60 + mm, appt.centre.timezone);
          if (newStartsAt.getTime() < Date.now() + appt.centre.minLeadMinutes * 60_000) {
            throw new Error("That time is too soon");
          }
          const slotEnd = new Date(newStartsAt.getTime() + appt.centreService.slotMinutes * 60_000);
          const taken = await tx.appointment.count({
            where: {
              id: { not: appt.id },
              ...(appt.resourceId ? { resourceId: appt.resourceId } : { centreServiceId: appt.centreServiceId }),
              startsAt: { gte: newStartsAt, lt: slotEnd },
              status: { in: [...ACTIVE] },
              deletedAt: null,
            },
          });
          if (taken >= appt.centreService.capacityPerSlot) {
            const err = new Error("That time was just taken") as Error & { code?: string };
            err.code = "SLOT_TAKEN";
            throw err;
          }
          await tx.appointment.update({
            where: { id: appt.id },
            data: { startsAt: newStartsAt, endsAt: slotEnd, status: "CONFIRMED", patientReschedules: { increment: 1 } },
          });
          await tx.scheduleChange.create({
            data: {
              appointmentId: appt.id, kind: "RESCHEDULE", initiatedBy: "PATIENT",
              oldStartsAt: appt.startsAt, newStartsAt,
            },
          });
          await tx.auditLog.create({
            data: { actorType: "PATIENT", entityType: "Appointment", entityId: appt.id, action: "request-new-time:auto" },
          });
          await enqueueNotification(tx, {
            appointmentId: appt.id, patientId: appt.patientId,
            templateKey: "RESCHEDULE_CONFIRMED", channel: "SMS",
          });
          if (appt.patient.email) {
            await enqueueNotification(tx, {
              appointmentId: appt.id, patientId: appt.patientId,
              templateKey: "RESCHEDULE_CONFIRMED", channel: "EMAIL",
            });
          }
        },
        { isolationLevel: "Serializable", timeout: 15_000 },
      );
      return { ok: true, status: "CONFIRMED" };
    } catch (e) {
      if ((e as { code?: string })?.code === "SLOT_TAKEN" || e instanceof Prisma.PrismaClientKnownRequestError && (e as { code?: string }).code === "P2034") {
        const fresh = await getAvailableSlots({ centreServiceId: b.centreServiceId, date: input.date, preferredTime: input.time });
        return {
          ok: false,
          error: "That time was just taken. Pick a fresh one.",
          alternatives: "alternatives" in fresh ? fresh.alternatives.slice(0, 4).map((s) => ({ start: s.start, date: input.date })) : [],
        };
      }
      throw e;
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Change failed" };
  }
}

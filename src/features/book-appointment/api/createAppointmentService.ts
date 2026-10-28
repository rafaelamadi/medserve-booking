import { Prisma } from "@prisma/client";
import { generateReference } from "@/entities/appointment";
import { localToUtc } from "@/entities/availability";
import { enqueueNotification } from "@/entities/notification";
import { findOrCreatePatientTx } from "@/entities/patient";
import { prismaDirect } from "@/shared/api/prisma";
import { normalizeNigerianPhone } from "@/shared/lib/phone";

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;

/** FR-B7: the slot was taken between selection and submit. Caller refetches alternatives. */
export class SlotTakenError extends Error {
  readonly code = "SLOT_TAKEN";
  constructor() {
    super("That time was just taken. Pick one of the fresh alternatives.");
  }
}

export type CreateAppointmentInput = {
  centreId: string;
  centreServiceId: string;
  /** Centre-local date + time, e.g. date "2026-10-14", time "08:30". */
  date: string;
  time: string;
  fullName: string;
  phone: string;
  email?: string;
  note?: string;
  source?: "WEB" | "STAFF" | "CHAT";
};

export type CreatedAppointment = {
  id: string;
  reference: string;
  status: "REQUESTED" | "CONFIRMED";
  startsAt: Date;
};

/**
 * FR-X4: internal service function (no auth/rate-limit inside) so the future
 * AI chat reuses it unchanged. Public callers wrap it with rate limits + guards.
 * Lives in the feature layer because it orchestrates across entity slices
 * (FSD: no cross-imports within the entities layer).
 *
 * FR-B6: AUTO + free slot → CONFIRMED immediately, else REQUESTED.
 * FR-B5: REVIEW services may request even a full preferred time.
 * PRD §7 concurrency: serialisable transaction re-checks capacity; a race
 * surfaces SlotTakenError (FR-B7), never a double booking.
 */
export async function createAppointmentService(input: CreateAppointmentInput): Promise<CreatedAppointment> {
  const phone = normalizeNigerianPhone(input.phone);
  const [hh, mm] = input.time.split(":").map(Number);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prismaDirect.$transaction(
        async (tx) => {
          const cs = await tx.centreService.findUnique({
            where: { id: input.centreServiceId },
            include: { centre: true, service: true },
          });
          if (!cs || !cs.isActive || !cs.centre.isActive || cs.centreId !== input.centreId) {
            throw new Error("Service unavailable at this centre");
          }
          const startsAt = localToUtc(input.date, hh * 60 + mm, cs.centre.timezone);
          const endsAt = new Date(startsAt.getTime() + cs.slotMinutes * 60_000);
          if (startsAt.getTime() < Date.now() + cs.centre.minLeadMinutes * 60_000) {
            throw new SlotTakenError();
          }

          // Capacity re-check inside the transaction (PRD §7).
          const taken = await tx.appointment.count({
            where: {
              ...(cs.resourceId ? { resourceId: cs.resourceId } : { centreServiceId: cs.id }),
              startsAt: { gte: startsAt, lt: endsAt },
              status: { in: [...ACTIVE] },
              deletedAt: null,
            },
          });
          const free = taken < cs.capacityPerSlot;
          if (!free && cs.confirmationMode === "AUTO") throw new SlotTakenError();
          const status = free && cs.confirmationMode === "AUTO" ? "CONFIRMED" : "REQUESTED";

          const patient = await findOrCreatePatientTx(tx, {
            phone,
            fullName: input.fullName.trim(),
            email: input.email?.trim() ? input.email.trim() : undefined,
          });

          const appointment = await tx.appointment.create({
            data: {
              reference: generateReference(cs.centre.code),
              patientId: patient.id,
              centreId: cs.centreId,
              centreServiceId: cs.id,
              resourceId: cs.resourceId,
              startsAt,
              endsAt,
              requestedStartsAt: startsAt,
              status,
              source: input.source ?? "WEB",
              patientNote: input.note?.trim() || undefined,
            },
          });

          // Consent record with timestamp (PRD §14; stored as audit, no schema change).
          await tx.auditLog.create({
            data: {
              actorType: "PATIENT",
              entityType: "Appointment",
              entityId: appointment.id,
              action: "consent-booking-v1",
              after: { reference: appointment.reference, at: new Date().toISOString() } as Prisma.InputJsonValue,
            },
          });
          await tx.auditLog.create({
            data: {
              actorType: "PATIENT",
              entityType: "Appointment",
              entityId: appointment.id,
              action: `booking-${status.toLowerCase()}`,
            },
          });

          const templateKey = status === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_RECEIVED";
          await enqueueNotification(tx, {
            appointmentId: appointment.id,
            patientId: patient.id,
            templateKey,
            channel: "SMS",
          });
          if (patient.email) {
            await enqueueNotification(tx, {
              appointmentId: appointment.id,
              patientId: patient.id,
              templateKey,
              channel: "EMAIL",
            });
          }
          return { id: appointment.id, reference: appointment.reference, status, startsAt };
        },
        { isolationLevel: "Serializable", timeout: 15_000 },
      );
    } catch (e) {
      if (e instanceof SlotTakenError) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2034") throw new SlotTakenError(); // serialisation race → treat as taken
        if (e.code === "P2002") continue; // reference collision → regenerate
      }
      throw e;
    }
  }
  throw new Error("Could not create booking, please retry");
}

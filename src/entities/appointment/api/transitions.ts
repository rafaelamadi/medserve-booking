import type { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { assertTransition } from "../lib/statusMachine";

export type TransitionKind = "confirm" | "propose" | "approve" | "cancel" | "checkin" | "complete" | "noshow";

/**
 * Notification writer injected by the caller (features). Keeps this slice
 * decoupled from the notification slice (FSD: no cross-imports in entities)
 * while still enqueueing inside the same transaction.
 */
export type TransitionNotifyFn = (
  tx: Prisma.TransactionClient,
  n: {
    appointmentId: string;
    patientId: string;
    templateKey: string;
    channel: "SMS" | "EMAIL";
    isChange: boolean;
  },
) => Promise<unknown>;

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;

export type TransitionInput = {
  id: string;
  kind: TransitionKind;
  /** STAFF by default; PATIENT for self-service cancel (FR-M3). */
  actorType?: "STAFF" | "PATIENT";
  staffId?: string;
  /** Centre scope enforced for STAFF: null = SUPER_ADMIN (all centres). */
  scopeCentreIds?: string[] | null;
  reason?: string;
  /** Required for propose (centre-local instant, computed by the caller). */
  newStartsAt?: Date;
  notify: TransitionNotifyFn;
};

/**
 * PRD engineering rule 3: every state transition goes through one service
 * function that updates the record, writes the audit log and enqueues the
 * notification in ONE transaction. Never bypass this for staff actions.
 */
export async function transitionAppointment(input: TransitionInput) {
  const before = await prisma.appointment.findUnique({
    where: { id: input.id },
    include: { centreService: true, patient: true },
  });
  if (!before || before.deletedAt) throw new Error("Appointment not found");
  const actor = input.actorType ?? "STAFF";
  if (actor === "STAFF") {
    if (!input.staffId) throw new Error("staffId is required for staff transitions");
    if (input.scopeCentreIds && !input.scopeCentreIds.includes(before.centreId)) {
      throw new Error("Forbidden: centre scope");
    }
  }

  // D1: proposing a new time on a REQUESTED booking confirms it at the new time.
  const target: AppointmentStatus =
    input.kind === "confirm" || input.kind === "approve"
      ? "CONFIRMED"
      : input.kind === "propose"
        ? before.status === "REQUESTED"
          ? "CONFIRMED"
          : "RESCHEDULE_PROPOSED"
        : input.kind === "cancel"
          ? "CANCELLED"
          : input.kind === "checkin"
            ? "CHECKED_IN"
            : input.kind === "complete"
              ? "COMPLETED"
              : "NO_SHOW";
  assertTransition(before.status, target);

  if (input.kind === "cancel" && actor === "STAFF" && !(input.reason?.trim())) {
    throw new Error("Cancel reason is required");
  }
  if (input.kind === "propose" && !input.newStartsAt) throw new Error("New time is required");

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let startsAt = before.startsAt;
    let endsAt = before.endsAt;
    if (input.kind === "approve") {
      // FR-H5: apply the patient's requested time from their latest change.
      const req = await tx.scheduleChange.findFirst({
        where: { appointmentId: before.id, kind: "RESCHEDULE", initiatedBy: "PATIENT" },
        orderBy: { createdAt: "desc" },
      });
      if (!req?.newStartsAt) throw new Error("No requested time found");
      const slotEnd = new Date(req.newStartsAt.getTime() + before.centreService.slotMinutes * 60_000);
      const taken = await tx.appointment.count({
        where: {
          id: { not: before.id },
          ...(before.resourceId
            ? { resourceId: before.resourceId }
            : { centreServiceId: before.centreServiceId }),
          startsAt: { gte: req.newStartsAt, lt: slotEnd },
          status: { in: [...ACTIVE] },
          deletedAt: null,
        },
      });
      if (taken >= before.centreService.capacityPerSlot) {
        throw new Error("Requested time is now full — propose another instead");
      }
      startsAt = req.newStartsAt;
      endsAt = slotEnd;
      await tx.scheduleChange.create({
        data: {
          appointmentId: before.id,
          kind: "RESCHEDULE",
          initiatedBy: "STAFF",
          staffId: actor === "STAFF" ? input.staffId : undefined,
          oldStartsAt: before.startsAt,
          newStartsAt: startsAt,
          reason: "Approved patient request",
        },
      });
    }
    if (input.kind === "propose" && input.newStartsAt) {
      const slotEnd = new Date(input.newStartsAt.getTime() + before.centreService.slotMinutes * 60_000);
      // Staff-proposed times respect capacity (pick another time when full).
      const taken = await tx.appointment.count({
        where: {
          id: { not: before.id },
          ...(before.resourceId
            ? { resourceId: before.resourceId }
            : { centreServiceId: before.centreServiceId }),
          startsAt: { gte: input.newStartsAt, lt: slotEnd },
          status: { in: [...ACTIVE] },
          deletedAt: null,
        },
      });
      if (taken >= before.centreService.capacityPerSlot) {
        throw new Error("That time is full — pick another");
      }
      startsAt = input.newStartsAt;
      endsAt = slotEnd;
      await tx.scheduleChange.create({
        data: {
          appointmentId: before.id,
          kind: "RESCHEDULE",
          initiatedBy: actor,
          staffId: actor === "STAFF" ? input.staffId : undefined,
          oldStartsAt: before.startsAt,
          newStartsAt: startsAt,
          reason: input.reason?.trim() || undefined,
        },
      });
    }
    if (input.kind === "cancel") {
      await tx.scheduleChange.create({
        data: {
          appointmentId: before.id,
          kind: "CANCEL",
          initiatedBy: actor,
          staffId: actor === "STAFF" ? input.staffId : undefined,
          oldStartsAt: before.startsAt,
          reason: input.reason?.trim(),
        },
      });
    }

    const after = await tx.appointment.update({
      where: { id: before.id },
      data: { status: target, startsAt, endsAt },
    });
    await tx.auditLog.create({
      data: {
        actorType: actor,
        staffId: actor === "STAFF" ? input.staffId : undefined,
        entityType: "Appointment",
        entityId: before.id,
        action: `${input.kind}:${before.status}->${target}`,
        before: { status: before.status, startsAt: before.startsAt } as Prisma.InputJsonValue,
        after: { status: target, startsAt } as Prisma.InputJsonValue,
      },
    });

    // Matching patient notification per transition (FR-H4); check-in/complete/no-show are silent.
    const notice =
      input.kind === "confirm"
        ? before.status === "REQUESTED"
          ? "BOOKING_CONFIRMED"
          : "RESCHEDULE_CONFIRMED"
        : input.kind === "propose"
          ? "BOOKING_TIME_UNAVAILABLE"
          : input.kind === "cancel"
            ? "BOOKING_CANCELLED"
            : null;
    if (notice) {
      const isChange = input.kind === "propose" || input.kind === "cancel";
      await input.notify(tx, {
        appointmentId: before.id,
        patientId: before.patientId,
        templateKey: notice,
        channel: "SMS",
        isChange,
      });
      if (before.patient.email) {
        await input.notify(tx, {
          appointmentId: before.id,
          patientId: before.patientId,
          templateKey: notice,
          channel: "EMAIL",
          isChange,
        });
      }
    }
    return { id: after.id, reference: before.reference, status: target };
  });
}

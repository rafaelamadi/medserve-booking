import type { StaffRole } from "@prisma/client";
import { writeAudit } from "@/entities/audit-log";
import { followUpScheduleSchema, type FollowUpScheduleInput } from "@/entities/follow-up-reminder";
import { prisma } from "@/shared/api/prisma";

type Result = { ok: true; id: string } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

export type FollowUpStaff = { staffId: string; role: StaffRole; centreIds: string[] };

function scopeCheck(staff: FollowUpStaff, centreId: string) {
  if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
}

/** FR-F1/F3 core (no session inside): schedule a follow-up reminder. Sent exactly once. */
export async function scheduleFollowUpService(
  rawInput: FollowUpScheduleInput,
  staff: FollowUpStaff,
): Promise<Result> {
  try {
    const data = followUpScheduleSchema.parse(rawInput);
    scopeCheck(staff, data.centreId);
    const dueOn = new Date(`${data.dueOn}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (dueOn < today) throw new Error("Due date must be in the future");

    let patientId = data.patientId;
    if (data.appointmentId) {
      const a = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        select: { patientId: true, centreId: true },
      });
      if (!a) throw new Error("Appointment not found");
      if (a.centreId !== data.centreId) throw new Error("Centre mismatch");
      patientId = a.patientId;
    }
    if (!patientId) throw new Error("Patient is required");
    const [centre, service] = await Promise.all([
      prisma.centre.findUnique({ where: { id: data.centreId }, select: { id: true } }),
      prisma.service.findUnique({ where: { id: data.serviceId }, select: { id: true } }),
    ]);
    if (!centre || !service) throw new Error("Unknown centre or service");

    const created = await prisma.followUpReminder.create({
      data: {
        patientId,
        appointmentId: data.appointmentId,
        centreId: data.centreId,
        serviceId: data.serviceId,
        dueOn,
        createdById: staff.staffId,
      },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "FollowUpReminder",
      entityId: created.id,
      action: "schedule",
      after: { dueOn: data.dueOn },
    });
    return { ok: true, id: created.id };
  } catch (e) {
    return fail(e);
  }
}

/** FR-F3 core (no session inside): cancel a scheduled reminder. */
export async function cancelFollowUpService(
  id: string,
  staff: FollowUpStaff,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const existing = await prisma.followUpReminder.findUnique({ where: { id } });
    if (!existing) throw new Error("Not found");
    scopeCheck(staff, existing.centreId);
    if (existing.status !== "SCHEDULED") throw new Error("Only scheduled reminders can change");
    await prisma.followUpReminder.update({ where: { id }, data: { status: "CANCELLED" } });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "FollowUpReminder",
      entityId: id,
      action: "cancel",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

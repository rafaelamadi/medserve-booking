import type { StaffRole } from "@prisma/client";
import { enqueueNotification } from "@/entities/notification";
import { prisma } from "@/shared/api/prisma";

type Result = { ok: true } | { ok: false; error: string };

export type ResultStaff = { staffId: string; role: StaffRole; centreIds: string[] };

function scopeCheck(staff: ResultStaff, centreId: string) {
  if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
}

/** FR-R1 core (no session inside): "Result ready" on a COMPLETED visit. */
export async function sendResultNoticeService(appointmentId: string, staff: ResultStaff): Promise<Result> {
  try {
    if (!["STAFF", "CLINICIAN", "CENTRE_MANAGER", "SUPER_ADMIN"].includes(staff.role)) {
      throw new Error("Forbidden");
    }
    const a = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!a || a.deletedAt) throw new Error("Not found");
    scopeCheck(staff, a.centreId);
    if (a.status !== "COMPLETED") throw new Error("Only completed visits can send result notices");
    const existing = await prisma.resultNotice.findUnique({ where: { appointmentId } });
    if (existing) return { ok: false, error: "Result notice already sent" };
    await prisma.$transaction(async (tx) => {
      const notice = await tx.resultNotice.create({
        data: { appointmentId, sentById: staff.staffId },
      });
      await enqueueNotification(tx, {
        appointmentId, patientId: a.patientId, templateKey: "RESULT_READY", channel: "SMS", isChange: true,
      });
      if (a.patient.email) {
        await enqueueNotification(tx, {
          appointmentId, patientId: a.patientId, templateKey: "RESULT_READY", channel: "EMAIL", isChange: true,
        });
      }
      await tx.auditLog.create({
        data: {
          actorType: "STAFF", staffId: staff.staffId,
          entityType: "ResultNotice", entityId: notice.id, action: "send",
        },
      });
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

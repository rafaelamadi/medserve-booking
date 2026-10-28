import type { StaffRole } from "@prisma/client";
import { writeAudit } from "@/entities/audit-log";
import { prisma } from "@/shared/api/prisma";

type Result = { ok: true } | { ok: false; error: string };

export type ResultStaff = { staffId: string; role: StaffRole; centreIds: string[] };

/** FR-R3 core (no session inside): mark a result notice collected. */
export async function markResultCollectedService(noticeId: string, staff: ResultStaff): Promise<Result> {
  try {
    const notice = await prisma.resultNotice.findUnique({
      where: { id: noticeId },
      include: { appointment: { select: { centreId: true } } },
    });
    if (!notice) throw new Error("Not found");
    if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(notice.appointment.centreId)) {
      throw new Error("Forbidden: centre scope");
    }
    await prisma.resultNotice.update({
      where: { id: noticeId },
      data: { collectedAt: new Date() },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "ResultNotice",
      entityId: noticeId,
      action: "collected",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

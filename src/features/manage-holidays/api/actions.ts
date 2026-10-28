"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { flagSessionsForHoliday } from "@/entities/care-series/api/maintenance";
import { holidayCreateSchema } from "@/entities/holiday";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

/**
 * FR-C7: per-centre (or global) holiday calendar.
 * New holidays flag affected series sessions (FR-S6) via flagSessionsForHoliday.
 */
export async function createHoliday(input: unknown): Promise<Result> {
  try {
    const data = holidayCreateSchema.parse(input);
    const staff = await requireRole("CENTRE_MANAGER");
    const centreId = data.centreId?.trim() ? data.centreId : null;
    if (centreId === null && staff.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can add global holidays");
    }
    if (centreId !== null && staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
      throw new Error("Forbidden: centre scope");
    }
    const created = await prisma.holiday.create({
      data: { centreId, date: new Date(`${data.date}T00:00:00Z`), name: data.name },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Holiday",
      entityId: created.id,
      action: "create",
      after: created,
    });
    // FR-S6: flag scheduled series sessions landing on the new holiday.
    await flagSessionsForHoliday(data.date, centreId);
    revalidatePath("/hub/settings/holidays");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteHoliday(id: string): Promise<Result> {
  try {
    const staff = await requireRole("CENTRE_MANAGER");
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new Error("Not found");
    if (existing.centreId === null && staff.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can remove global holidays");
    }
    if (
      existing.centreId !== null &&
      staff.role !== "SUPER_ADMIN" &&
      !staff.centreIds.includes(existing.centreId)
    ) {
      throw new Error("Forbidden: centre scope");
    }
    await prisma.holiday.delete({ where: { id } });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Holiday",
      entityId: id,
      action: "delete",
      before: existing,
    });
    revalidatePath("/hub/settings/holidays");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

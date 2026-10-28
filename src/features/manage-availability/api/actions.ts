"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { availabilityRuleSchema, closureSchema } from "@/entities/availability";
import { flagSessionsForClosure } from "@/entities/care-series/api/maintenance";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

async function managerForCentre(centreId: string) {
  const staff = await requireRole("CENTRE_MANAGER");
  if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  return staff;
}

async function centreOfService(centreServiceId: string): Promise<string> {
  const cs = await prisma.centreService.findUnique({
    where: { id: centreServiceId },
    select: { centreId: true },
  });
  if (!cs) throw new Error("Service not found");
  return cs.centreId;
}

/**
 * FR-C5: replace the weekly rules for one centre service.
 * Times arrive as "HH:MM" from the UI and are stored as minutes (PRD §10).
 */
export async function saveAvailabilityRules(
  centreServiceId: string,
  rows: Array<{ dayOfWeek: number; start: string; end: string }>,
): Promise<Result> {
  try {
    const centreId = await centreOfService(centreServiceId);
    const staff = await managerForCentre(centreId);
    const toMin = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) throw new Error(`Bad time: ${s}`);
      return h * 60 + m;
    };
    const parsed = rows.map((r) =>
      availabilityRuleSchema.parse({
        centreServiceId,
        dayOfWeek: r.dayOfWeek,
        startMinute: toMin(r.start),
        endMinute: toMin(r.end),
      }),
    );
    for (const r of parsed) {
      if (r.endMinute <= r.startMinute) throw new Error("End must be after start");
    }
    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { centreServiceId } }),
      prisma.availabilityRule.createMany({
        data: parsed.map((r) => ({
          centreServiceId,
          dayOfWeek: r.dayOfWeek,
          startMinute: r.startMinute,
          endMinute: r.endMinute,
        })),
      }),
    ]);
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "AvailabilityRule",
      entityId: centreServiceId,
      action: "replace-rules",
      after: parsed,
    });
    revalidatePath("/hub/settings/availability");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** FR-C6: date-range closures per centre or resource. */
export async function createClosure(input: unknown): Promise<Result> {
  try {
    const data = closureSchema.parse(input);
    const staff = await managerForCentre(data.centreId);
    const resourceId = data.resourceId?.trim() ? data.resourceId : null;
    if (resourceId) {
      const res = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!res || res.centreId !== data.centreId) throw new Error("Resource belongs to another centre");
    }
    const created = await prisma.closure.create({
      data: {
        centreId: data.centreId,
        resourceId,
        startsOn: new Date(`${data.startsOn}T00:00:00Z`),
        endsOn: new Date(`${data.endsOn}T00:00:00Z`),
        reason: data.reason?.trim() || undefined,
      },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Closure",
      entityId: created.id,
      action: "create",
      after: created,
    });
    // FR-S6: flag scheduled series sessions inside the new closure.
    await flagSessionsForClosure({
      centreId: data.centreId,
      startsOn: data.startsOn,
      endsOn: data.endsOn,
      resourceId,
    });
    revalidatePath("/hub/settings/availability");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteClosure(id: string): Promise<Result> {
  try {
    const existing = await prisma.closure.findUnique({ where: { id } });
    if (!existing) throw new Error("Not found");
    const staff = await managerForCentre(existing.centreId);
    await prisma.closure.delete({ where: { id } });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Closure",
      entityId: id,
      action: "delete",
      before: existing,
    });
    revalidatePath("/hub/settings/availability");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

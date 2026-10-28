"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { centreServiceUpsertSchema } from "@/entities/centre-service";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";
import { z } from "zod";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

async function managerForCentre(centreId: string) {
  const staff = await requireRole("CENTRE_MANAGER");
  if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  return staff;
}

const updateSchema = centreServiceUpsertSchema.partial().omit({ centreId: true, serviceId: true });

/** FR-C3: enable a service at a centre (mode, slot length, capacity, resource bind). */
export async function upsertCentreService(input: unknown): Promise<Result> {
  try {
    const data = centreServiceUpsertSchema.parse(input);
    const staff = await managerForCentre(data.centreId);
    const resourceId = data.resourceId?.trim() ? data.resourceId : undefined;
    if (resourceId) {
      const res = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!res || res.centreId !== data.centreId) throw new Error("Resource belongs to another centre");
    }
    const { centreId, serviceId, ...rest } = data;
    const saved = await prisma.centreService.upsert({
      where: { centreId_serviceId: { centreId, serviceId } },
      update: { ...rest, resourceId },
      create: { centreId, serviceId, ...rest, resourceId },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "CentreService",
      entityId: saved.id,
      action: "upsert",
      after: saved,
    });
    revalidatePath("/hub/settings/centre-services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateCentreService(id: string, input: unknown): Promise<Result> {
  try {
    const existing = await prisma.centreService.findUnique({ where: { id } });
    if (!existing) throw new Error("Not found");
    const staff = await managerForCentre(existing.centreId);
    const data = z.object(updateSchema.shape).parse(input);
    const resourceId = data.resourceId?.trim() ? data.resourceId : null;
    if (resourceId) {
      const res = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!res || res.centreId !== existing.centreId) throw new Error("Resource belongs to another centre");
    }
    const after = await prisma.centreService.update({ where: { id }, data: { ...data, resourceId } });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "CentreService",
      entityId: id,
      action: "update",
      before: existing,
      after,
    });
    revalidatePath("/hub/settings/centre-services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

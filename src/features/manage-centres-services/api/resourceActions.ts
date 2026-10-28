"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { resourceCreateSchema, resourceUpdateSchema } from "@/entities/resource";
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

/** FR-C4: machines/rooms per centre. */
export async function createResource(input: unknown): Promise<Result> {
  try {
    const data = resourceCreateSchema.parse(input);
    const staff = await managerForCentre(data.centreId);
    const created = await prisma.resource.create({ data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Resource",
      entityId: created.id,
      action: "create",
      after: created,
    });
    revalidatePath("/hub/settings/centre-services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateResource(id: string, input: unknown): Promise<Result> {
  try {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) throw new Error("Not found");
    const staff = await managerForCentre(existing.centreId);
    const data = resourceUpdateSchema.parse(input);
    const after = await prisma.resource.update({ where: { id }, data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Resource",
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

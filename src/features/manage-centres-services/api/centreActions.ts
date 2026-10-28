"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { centreCreateSchema, centreUpdateSchema } from "@/entities/centre";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

/** FR-C1: creating a centre is SUPER_ADMIN only. */
export async function createCentre(input: unknown): Promise<Result> {
  try {
    const staff = await requireRole("SUPER_ADMIN");
    const data = centreCreateSchema.parse(input);
    const created = await prisma.centre.create({ data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Centre",
      entityId: created.id,
      action: "create",
      after: created,
    });
    revalidatePath("/hub/settings/centres");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** FR-C1: SUPER_ADMIN anywhere; CENTRE_MANAGER only for own centres. */
export async function updateCentre(id: string, input: unknown): Promise<Result> {
  try {
    const staff = await requireRole("CENTRE_MANAGER");
    if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(id)) {
      throw new Error("Forbidden: centre scope");
    }
    const data = centreUpdateSchema.parse(input);
    const before = await prisma.centre.findUnique({ where: { id } });
    const after = await prisma.centre.update({ where: { id }, data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Centre",
      entityId: id,
      action: "update",
      before,
      after,
    });
    revalidatePath("/hub/settings/centres");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

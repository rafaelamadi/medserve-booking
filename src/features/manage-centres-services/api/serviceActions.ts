"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { serviceCreateSchema, serviceUpdateSchema } from "@/entities/service";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

/** FR-C2: global service catalogue is SUPER_ADMIN only. */
export async function createService(input: unknown): Promise<Result> {
  try {
    const staff = await requireRole("SUPER_ADMIN");
    const data = serviceCreateSchema.parse(input);
    const created = await prisma.service.create({ data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Service",
      entityId: created.id,
      action: "create",
      after: created,
    });
    revalidatePath("/hub/settings/services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateService(id: string, input: unknown): Promise<Result> {
  try {
    const staff = await requireRole("SUPER_ADMIN");
    const data = serviceUpdateSchema.parse(input);
    const before = await prisma.service.findUnique({ where: { id } });
    const after = await prisma.service.update({ where: { id }, data });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "Service",
      entityId: id,
      action: "update",
      before,
      after,
    });
    revalidatePath("/hub/settings/services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

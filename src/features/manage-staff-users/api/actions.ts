"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/entities/audit-log";
import { staffInviteSchema } from "@/entities/staff-user";
import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

/** FR-C8: invite staff (SUPER_ADMIN only). Dev credentials sign-in needs no password. */
export async function inviteStaff(input: unknown): Promise<Result> {
  try {
    const staff = await requireRole("SUPER_ADMIN");
    const data = staffInviteSchema.parse(input);
    if (data.centreIds.length > 0) {
      const found = await prisma.centre.count({ where: { id: { in: data.centreIds } } });
      if (found !== data.centreIds.length) throw new Error("Unknown centre selected");
    }
    const created = await prisma.staffUser.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        centres: { create: data.centreIds.map((centreId) => ({ centreId })) },
      },
    });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "StaffUser",
      entityId: created.id,
      action: "invite",
      after: { email: created.email, role: created.role },
    });
    revalidatePath("/hub/settings/users");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** FR-C8: deactivate / reactivate. Staff cannot deactivate themselves. */
export async function setStaffActive(id: string, isActive: boolean): Promise<Result> {
  try {
    const staff = await requireRole("SUPER_ADMIN");
    if (id === staff.staffId && !isActive) throw new Error("You cannot deactivate yourself");
    const before = await prisma.staffUser.findUnique({ where: { id } });
    if (!before) throw new Error("Not found");
    const after = await prisma.staffUser.update({ where: { id }, data: { isActive } });
    await writeAudit({
      actorType: "STAFF",
      staffId: staff.staffId,
      entityType: "StaffUser",
      entityId: id,
      action: isActive ? "reactivate" : "deactivate",
      before: { isActive: before.isActive },
      after: { isActive: after.isActive },
    });
    revalidatePath("/hub/settings/users");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

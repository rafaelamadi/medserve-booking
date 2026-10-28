"use server";

import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

export async function listAuditFor(entityType: string, entityId: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { staff: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

"use server";

import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** FR-R5: uncollected (or all) result notices in scope. */
export async function listResultNotices(collected: "pending" | "collected" | "all" = "pending") {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = s.role === "SUPER_ADMIN" ? null : s.centreIds;
  return prisma.resultNotice.findMany({
    where: {
      collectedAt: collected === "pending" ? null : collected === "collected" ? { not: null } : undefined,
      appointment: allowed ? { centreId: { in: allowed } } : undefined,
    },
    include: {
      appointment: {
        select: {
          reference: true,
          startsAt: true,
          patient: { select: { fullName: true, phone: true } },
          centre: { select: { code: true } },
          centreService: { select: { service: { select: { name: true } } } },
        },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 200,
  });
}

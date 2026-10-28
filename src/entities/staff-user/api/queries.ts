import { prisma } from "@/shared/api/prisma";
import { requireRole } from "@/shared/lib/auth";

/** FR-C8: staff user management is SUPER_ADMIN only. */
export async function listStaffUsers() {
  await requireRole("SUPER_ADMIN");
  return prisma.staffUser.findMany({
    include: { centres: { include: { centre: { select: { code: true } } } } },
    orderBy: { email: "asc" },
  });
}

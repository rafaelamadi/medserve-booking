import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** Global holidays + holidays for the staff member's centres. */
export async function listHolidays() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const where =
    s.role === "SUPER_ADMIN"
      ? {}
      : { OR: [{ centreId: null }, { centreId: { in: s.centreIds } }] };
  return prisma.holiday.findMany({
    where,
    include: { centre: { select: { code: true } } },
    orderBy: { date: "asc" },
  });
}

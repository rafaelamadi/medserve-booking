import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** All hub queries are centre-scoped unless SUPER_ADMIN (PRD §3). */
export async function listCentres() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  if (s.role === "SUPER_ADMIN") {
    return prisma.centre.findMany({ orderBy: { code: "asc" } });
  }
  return prisma.centre.findMany({
    where: { id: { in: s.centreIds } },
    orderBy: { code: "asc" },
  });
}

export async function getCentre(id: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  if (s.role !== "SUPER_ADMIN" && !s.centreIds.includes(id)) throw new Error("Forbidden");
  return prisma.centre.findUnique({ where: { id } });
}

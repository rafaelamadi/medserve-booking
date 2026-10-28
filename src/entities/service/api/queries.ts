import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** Global catalogue: any signed-in staff may list; mutations are role-gated in features. */
export async function listServices() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  return prisma.service.findMany({ orderBy: { name: "asc" } });
}

export async function getService(id: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  return prisma.service.findUnique({ where: { id } });
}

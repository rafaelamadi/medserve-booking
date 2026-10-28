import { prisma } from "@/shared/api/prisma";
import { requireCentreAccess } from "@/shared/lib/auth";

export async function listResources(centreId: string) {
  await requireCentreAccess(centreId);
  return prisma.resource.findMany({
    where: { centreId },
    orderBy: { name: "asc" },
  });
}

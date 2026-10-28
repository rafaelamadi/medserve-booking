import { prisma } from "@/shared/api/prisma";
import { requireCentreAccess } from "@/shared/lib/auth";

export async function listCentreServices(centreId: string) {
  await requireCentreAccess(centreId);
  return prisma.centreService.findMany({
    where: { centreId },
    include: {
      service: { select: { id: true, name: true, slug: true, category: true } },
      resource: { select: { id: true, name: true } },
    },
    orderBy: { service: { name: "asc" } },
  });
}

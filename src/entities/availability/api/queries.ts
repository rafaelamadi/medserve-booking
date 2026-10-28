import { prisma } from "@/shared/api/prisma";
import { requireCentreAccess } from "@/shared/lib/auth";

export async function listRulesForCentre(centreId: string) {
  await requireCentreAccess(centreId);
  return prisma.availabilityRule.findMany({
    where: { centreService: { centreId } },
    include: { centreService: { select: { id: true, service: { select: { name: true } } } } },
  });
}

export async function listClosuresForCentre(centreId: string) {
  await requireCentreAccess(centreId);
  return prisma.closure.findMany({
    where: { centreId },
    include: { resource: { select: { name: true } } },
    orderBy: { startsOn: "asc" },
  });
}

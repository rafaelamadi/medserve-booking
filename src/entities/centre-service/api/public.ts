"use server";

import { prisma } from "@/shared/api/prisma";

/** Public catalogue for the booking wizard (FR-B1): enabled services at a centre. */
export async function listPublicCentreServices(centreId: string) {
  return prisma.centreService.findMany({
    where: { centreId, isActive: true, service: { isActive: true }, centre: { isActive: true } },
    select: {
      id: true,
      confirmationMode: true,
      slotMinutes: true,
      service: { select: { name: true, category: true, description: true } },
    },
    orderBy: { service: { name: "asc" } },
  });
}

"use server";

import { prisma } from "@/shared/api/prisma";

/** Public catalogue for the booking wizard (FR-B1): active centres, limited fields. */
export async function listPublicCentres() {
  return prisma.centre.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, city: true, state: true, phone: true },
    orderBy: { code: "asc" },
  });
}

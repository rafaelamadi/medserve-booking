"use server";

import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** Series list scoped to the staff member's centres. */
export async function listCareSeries(status?: "ACTIVE" | "COMPLETED" | "CANCELLED") {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = s.role === "SUPER_ADMIN" ? null : s.centreIds;
  const all = await prisma.careSeries.findMany({
    where: {
      status: status ?? undefined,
      centreService: allowed ? { centreId: { in: allowed } } : undefined,
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
      centreService: {
        select: { service: { select: { name: true } }, centre: { select: { code: true } } },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const flaggedIds = await prisma.appointment.findMany({
    where: {
      careSeriesId: { in: all.map((x) => x.id) },
      needsAttention: true,
      deletedAt: null,
    },
    select: { careSeriesId: true },
  });
  const flagged = new Set(flaggedIds.map((f) => f.careSeriesId));
  return all.map((x) => ({ ...x, needsAttention: flagged.has(x.id) }));
}

export async function getCareSeriesDetail(id: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const x = await prisma.careSeries.findUnique({
    where: { id },
    include: {
      patient: true,
      centreService: {
        include: { service: true, centre: true },
      },
      appointments: { orderBy: { sequenceNo: "asc" } },
      changes: { include: { staff: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      createdBy: { select: { name: true } },
    },
  });
  if (!x) return null;
  if (s.role !== "SUPER_ADMIN" && !s.centreIds.includes(x.centreService.centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  return x;
}

/** FR-S6 panel source: flagged series sessions in scope. */
export async function listFlaggedSessions(scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeCentreIds ?? s.centreIds;
  return prisma.appointment.findMany({
    where: {
      careSeriesId: { not: null },
      needsAttention: true,
      deletedAt: null,
      centreId: s.role === "SUPER_ADMIN" && !scopeCentreIds ? undefined : { in: allowed },
    },
    include: {
      patient: { select: { fullName: true } },
      centre: { select: { code: true, timezone: true } },
      careSeries: { select: { id: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
}

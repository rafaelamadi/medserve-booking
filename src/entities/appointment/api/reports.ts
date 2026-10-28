"use server";

import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

export type ReportFilters = {
  centreId?: string;
  serviceId?: string;
  status?: string; // AppointmentStatus or "ALL"
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
};

function scopeOr(scope: string[] | null, sessionCentreIds: string[]): string[] | null {
  return scope ?? sessionCentreIds;
}

/** Shared where-builder for reports (centre-scoped, soft-delete aware). */
async function reportWhere(filters: ReportFilters, scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeOr(scopeCentreIds, s.centreIds);
  if (allowed && filters.centreId && !allowed.includes(filters.centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  return {
    deletedAt: null,
    centreId: filters.centreId ?? (allowed ? { in: allowed } : undefined),
    centreServiceId: filters.serviceId || undefined,
    status:
      filters.status && filters.status !== "ALL"
        ? (filters.status as AppointmentStatus)
        : undefined,
    startsAt: {
      gte: filters.from ? new Date(`${filters.from}T00:00:00Z`) : undefined,
      lte: filters.to ? new Date(`${filters.to}T23:59:59Z`) : undefined,
    },
  };
}

/** FR-7: report rows (capped) + status/service breakdowns. */
export async function getReport(filters: ReportFilters, scopeCentreIds: string[] | null) {
  const where = await reportWhere(filters, scopeCentreIds);
  const [rows, byStatus, byService, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { fullName: true, phone: true } },
        centre: { select: { code: true } },
        centreService: { select: { service: { select: { name: true } } } },
      },
      orderBy: { startsAt: "asc" },
      take: 1000,
    }),
    prisma.appointment.groupBy({ by: ["status"], where, _count: true }),
    prisma.appointment.groupBy({ by: ["centreServiceId"], where, _count: true }),
    prisma.appointment.count({ where }),
  ]);
  const serviceIds = byService.map((b) => b.centreServiceId);
  const services = await prisma.centreService.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, service: { select: { name: true } }, centre: { select: { code: true } } },
  });
  return {
    total,
    capped: rows.length,
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count })),
    byService: byService.map((b) => {
      const meta = services.find((x) => x.id === b.centreServiceId);
      return { service: meta ? `${meta.centre.code} · ${meta.service.name}` : b.centreServiceId, count: b._count };
    }),
    rows: rows.map((a) => ({
      reference: a.reference,
      startsAt: a.startsAt.toISOString(),
      status: a.status,
      source: a.source,
      patient: a.patient.fullName,
      phone: a.patient.phone,
      centre: a.centre.code,
      service: a.centreService.service.name,
    })),
  };
}

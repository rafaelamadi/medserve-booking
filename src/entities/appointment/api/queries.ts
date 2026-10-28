"use server";

import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

export type QueueFilters = {
  centreId?: string;
  serviceId?: string;
  status?: AppointmentStatus | "ALL";
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  search?: string; // reference, name or phone
};

function scopeOr(scope: string[] | null, sessionCentreIds: string[]): string[] | null {
  return scope ?? sessionCentreIds;
}

/** FR-H2: filterable, searchable, centre-scoped queue. */
export async function listAppointments(filters: QueueFilters, scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeOr(scopeCentreIds, s.centreIds);
  if (allowed && filters.centreId && !allowed.includes(filters.centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  const q = filters.search?.trim();
  return prisma.appointment.findMany({
    where: {
      deletedAt: null,
      centreId: filters.centreId ?? (allowed ? { in: allowed } : undefined),
      centreServiceId: filters.serviceId || undefined,
      status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
      startsAt: {
        gte: filters.from ? new Date(`${filters.from}T00:00:00Z`) : undefined,
        lte: filters.to ? new Date(`${filters.to}T23:59:59Z`) : undefined,
      },
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: "insensitive" } },
              { patient: { fullName: { contains: q, mode: "insensitive" } } },
              { patient: { phone: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
      centre: { select: { code: true, timezone: true } },
      centreService: { select: { service: { select: { name: true } } } },
    },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
}

/** FR-H2 detail with timeline inputs (changes, notifications). */
export async function getAppointmentDetail(id: string, scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeOr(scopeCentreIds, s.centreIds);
  const a = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      centre: true,
      centreService: { include: { service: true, resource: true } },
      resource: true,
      changes: { include: { staff: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 30 },
      resultNotice: true,
    },
  });
  if (!a || a.deletedAt) return null;
  if (allowed && !allowed.includes(a.centreId)) throw new Error("Forbidden: centre scope");
  return a;
}

/** FR-H1 dashboard stats for the staff member's scope. */
export async function getDashboardStats(scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeOr(scopeCentreIds, s.centreIds);
  const centreFilter = allowed ? { centreId: { in: allowed } } : {};
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 3600_000);
  const ago7 = new Date(now.getTime() - 7 * 24 * 3600_000);

  const [today, pendingConfirm, pendingReschedule, failed, terminal30, byService] = await Promise.all([
    prisma.appointment.count({ where: { ...centreFilter, deletedAt: null, startsAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.appointment.count({ where: { ...centreFilter, deletedAt: null, status: "REQUESTED" } }),
    prisma.appointment.count({ where: { ...centreFilter, deletedAt: null, status: "RESCHEDULE_REQUESTED" } }),
    prisma.notification.count({
      where: { status: "FAILED", isChange: true, appointment: allowed ? { centreId: { in: allowed } } : undefined },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { ...centreFilter, deletedAt: null, startsAt: { gte: ago30 }, status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED"] } },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ["centreServiceId"],
      where: { ...centreFilter, deletedAt: null, startsAt: { gte: ago7 }, status: { not: "CANCELLED" } },
      _count: true,
    }),
  ]);
  const done = terminal30.find((t) => t.status === "COMPLETED")?._count ?? 0;
  const noShow = terminal30.find((t) => t.status === "NO_SHOW")?._count ?? 0;
  const noShowRate = done + noShow === 0 ? 0 : Math.round((noShow / (done + noShow)) * 100);
  const serviceIds = byService.map((b) => b.centreServiceId);
  const services = await prisma.centreService.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, service: { select: { name: true } }, centre: { select: { code: true } } },
  });
  const utilisation = byService
    .map((b) => {
      const meta = services.find((x) => x.id === b.centreServiceId);
      return { service: meta ? `${meta.centre.code} · ${meta.service.name}` : b.centreServiceId, count: b._count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return { today, pendingConfirm, pendingReschedule, failed, noShowRate, utilisation };
}

/** FR-H5: patient reschedule requests awaiting staff decision, with requested times. */
export async function listRescheduleRequests(scopeCentreIds: string[] | null) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const allowed = scopeOr(scopeCentreIds, s.centreIds);
  return prisma.appointment.findMany({
    where: {
      deletedAt: null,
      status: "RESCHEDULE_REQUESTED",
      centreId: allowed ? { in: allowed } : undefined,
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
      centre: { select: { code: true, timezone: true } },
      centreService: { select: { service: { select: { name: true } } } },
      changes: {
        where: { kind: "RESCHEDULE", initiatedBy: "PATIENT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
    take: 200,
  });
}

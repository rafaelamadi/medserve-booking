"use server";

import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";
import { normalizeNigerianPhone } from "@/shared/lib/phone";

/** FR-H6 support: find a patient by phone for series building. */
export async function findPatientByPhone(rawPhone: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  let phone: string;
  try {
    phone = normalizeNigerianPhone(rawPhone);
  } catch {
    return null;
  }
  return prisma.patient.findFirst({
    where: { phone, deletedAt: null },
    select: { id: true, phone: true, fullName: true, email: true },
  });
}

/** FR-H6: patient list — scoped by appointment centres unless SUPER_ADMIN. */
export async function listPatients(search?: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const q = search?.trim();
  const inScope =
    s.role === "SUPER_ADMIN"
      ? {}
      : { appointments: { some: { centreId: { in: s.centreIds }, deletedAt: null } } };
  return prisma.patient.findMany({
    where: {
      deletedAt: null,
      ...inScope,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

/** FR-H6: patient detail with appointment history (scoped). */
export async function getPatientDetail(id: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const p = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        where: { deletedAt: null },
        include: {
          centre: { select: { code: true, timezone: true } },
          centreService: { select: { service: { select: { name: true } } } },
        },
        orderBy: { startsAt: "desc" },
        take: 100,
      },
    },
  });
  if (!p || p.deletedAt) return null;
  if (s.role !== "SUPER_ADMIN") {
    const inScope = p.appointments.some((a) => s.centreIds.includes(a.centreId));
    if (!inScope) throw new Error("Forbidden: centre scope");
    return { ...p, appointments: p.appointments.filter((a) => s.centreIds.includes(a.centreId)) };
  }
  return p;
}

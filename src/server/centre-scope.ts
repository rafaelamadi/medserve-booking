"use server";

import { cookies } from "next/headers";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";
import {
  type ScopeCentre,
  type CentreWithServices,
  ALL_CENTRES_SCOPE,
  MEDSERVE_CENTRES,
  CANONICAL_CENTRES_WITH_SERVICES,
} from "@/types/centre-scope";

const COOKIE = "ms-centre";

/** Persist staff member's active working centre scope in a cookie */
export async function setSelectedCentre(centreId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, centreId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false,
    sameSite: "lax",
  });
}

/** Retrieve available centres for the signed-in staff and the current active centre */
export async function getScopeCentres(): Promise<{
  centres: ScopeCentre[];
  selected: ScopeCentre;
}> {
  let list: ScopeCentre[] = [];

  try {
    await getStaffSession();
    const dbCentres = await prisma.centre.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, city: true },
      orderBy: { code: "asc" },
    });

    if (dbCentres && dbCentres.length > 0) {
      list = dbCentres.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        city: c.city || (c.code === "MLCC" ? "Lagos" : c.code === "MKDC" ? "Kano" : "Umuahia"),
      }));
    }
  } catch {
    // Database offline mode: continue to default fallback
  }

  if (list.length === 0) {
    list = [...MEDSERVE_CENTRES];
  }

  const centres: ScopeCentre[] = [ALL_CENTRES_SCOPE, ...list];
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE)?.value;

  // Default to ALL_CENTRES_SCOPE when no cookie or cookie is "all"
  const selected = (!raw || raw === "all" || raw === "ALL")
    ? ALL_CENTRES_SCOPE
    : centres.find((c) => c.id === raw || c.code === raw) ?? ALL_CENTRES_SCOPE;

  return { centres, selected };
}

/** Retrieve all centres and their specific allowed services live from database with fallback */
export async function getLiveCentresWithServices(): Promise<CentreWithServices[]> {
  try {
    const dbCentres = await prisma.centre.findMany({
      where: { isActive: true },
      include: {
        centreServices: {
          where: { isActive: true },
          include: { service: true },
        },
      },
      orderBy: { code: "asc" },
    });

    if (dbCentres && dbCentres.length > 0) {
      return dbCentres.map((c) => ({
        id: c.id,
        code: c.code as "MLCC" | "MKDC" | "MUDC",
        name: c.name,
        city: c.city || (c.code === "MLCC" ? "Lagos" : c.code === "MKDC" ? "Kano" : "Umuahia"),
        state: c.state || (c.code === "MLCC" ? "Lagos" : c.code === "MKDC" ? "Kano" : "Abia"),
        phone: c.phone || "+234 800 000 0000",
        services: c.centreServices.map((cs) => ({
          id: cs.service.id,
          slug: cs.service.slug,
          name: cs.service.name,
          category: cs.service.category as "ONCOLOGY" | "DIAGNOSTIC",
          supportsSeries: cs.service.supportsSeries,
        })),
      }));
    }
  } catch {
    // Database offline mode: continue to canonical centres
  }

  return CANONICAL_CENTRES_WITH_SERVICES;
}

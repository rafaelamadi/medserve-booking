"use server";

import { cookies } from "next/headers";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

const COOKIE = "ms-centre";

/** Persist the staff member's working centre (hub scope). */
export async function setSelectedCentre(centreId: string): Promise<void> {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  if (s.role !== "SUPER_ADMIN" && !s.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  (await cookies()).set(COOKIE, centreId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
  });
}

export type ScopeCentre = { id: string; code: string; name: string };

/** Centres visible to the staff member + the selected one (cookie, validated). */
export async function getScopeCentres(): Promise<{ centres: ScopeCentre[]; selected: ScopeCentre | null }> {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const centres =
    s.role === "SUPER_ADMIN"
      ? await prisma.centre.findMany({
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        })
      : await prisma.centre.findMany({
          where: { id: { in: s.centreIds }, isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        });
  const raw = (await cookies()).get(COOKIE)?.value;
  const selected = centres.find((c) => c.id === raw) ?? centres[0] ?? null;
  return { centres, selected };
}

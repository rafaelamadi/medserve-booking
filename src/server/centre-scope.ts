"use server";

import { cookies } from "next/headers";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";
import { type ScopeCentre, MEDSERVE_CENTRES } from "@/types/centre-scope";

const COOKIE = "ms-centre";

/** Persist staff member's active working centre scope in a cookie */
export async function setSelectedCentre(centreId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, centreId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
  });
}

/** Retrieve available centres for the signed-in staff and the current active centre */
export async function getScopeCentres(): Promise<{
  centres: ScopeCentre[];
  selected: ScopeCentre;
}> {
  try {
    await getStaffSession();
    const dbCentres = await prisma.centre.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });

    if (dbCentres && dbCentres.length > 0) {
      const centres: ScopeCentre[] = dbCentres.map((c) => ({
        ...c,
        city: c.code === "MLCC" ? "Lagos" : c.code === "MKDC" ? "Kano" : "Abuja",
      }));
      const cookieStore = await cookies();
      const raw = cookieStore.get(COOKIE)?.value;
      const selected = centres.find((c) => c.id === raw) ?? centres[0];
      return { centres, selected };
    }
  } catch {
    // Database offline mode: continue to default fallback
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE)?.value;
  const selected = MEDSERVE_CENTRES.find((c) => c.id === raw) ?? MEDSERVE_CENTRES[0];
  return { centres: MEDSERVE_CENTRES, selected };
}

"use server";

import { headers } from "next/headers";
import { getAvailableSlots, getClosedDays } from "@/entities/availability";
import { getClientIp, rateLimit } from "@/shared/lib/rateLimit";
import { prisma } from "@/shared/api/prisma";

export type PublicSlot = { start: string; startsAt: string; endsAt: string; remaining: number };
export type PublicSlotsResult = {
  slots: PublicSlot[];
  preferredAvailable?: boolean;
  alternatives: PublicSlot[];
  closed?: boolean;
  outOfWindow?: boolean;
};

/**
 * Public read layer for the booking wizard, backed by TanStack Query on the client.
 * Rate-limited per IP (FR-B10). No auth: booking is public by design.
 */
export async function getPublicSlots(
  centreServiceId: string,
  date: string,
  preferredTime?: string,
): Promise<PublicSlotsResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`slots:${ip}`, 60, 60_000).ok) throw new Error("Too many requests, slow down");
  const res = await getAvailableSlots({ centreServiceId, date, preferredTime });
  if ("closed" in res) return { slots: [], alternatives: [], closed: true };
  if ("outOfWindow" in res) return { slots: [], alternatives: [], outOfWindow: true };
  const ser = (list: typeof res.slots): PublicSlot[] =>
    list.map((s) => ({ start: s.start, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), remaining: s.remaining }));
  return { slots: ser(res.slots), preferredAvailable: res.preferredAvailable, alternatives: ser(res.alternatives) };
}

export async function getPublicClosedDays(centreServiceId: string, yearMonth: string) {
  const ip = getClientIp(await headers());
  if (!rateLimit(`closed:${ip}`, 60, 60_000).ok) throw new Error("Too many requests, slow down");
  return getClosedDays(centreServiceId, yearMonth);
}

/** Limited public confirmation lookup by reference (detailed manage view lands in Phase 4). */
export async function getBookingConfirmation(reference: string) {
  const a = await prisma.appointment.findUnique({
    where: { reference: reference.trim().toUpperCase() },
    include: {
      centre: { select: { name: true, phone: true, timezone: true } },
      centreService: { select: { service: { select: { name: true, prepInstructions: true } } } },
    },
  });
  if (!a || a.deletedAt) return null;
  return {
    reference: a.reference,
    status: a.status,
    startsAt: a.startsAt.toISOString(),
    centreName: a.centre.name,
    centrePhone: a.centre.phone,
    centreTimezone: a.centre.timezone,
    serviceName: a.centreService.service.name,
    prepInstructions: a.centreService.service.prepInstructions,
  };
}

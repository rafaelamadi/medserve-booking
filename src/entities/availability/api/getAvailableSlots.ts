import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { generateSlotsForDay, nearestSlots } from "../lib/generateSlots";
import {
  addDaysStr,
  localToUtc,
  minutesToHHmm,
  toDateStrInZone,
  utcToLocalMinutes,
} from "../lib/timezone";
import type { ClosureRange, Slot } from "../model/types";

// PRD §7 step 4: slots blocked while active appointments reach capacity.
const ACTIVE_STATUSES: AppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "RESCHEDULE_PROPOSED",
  "CHECKED_IN",
];

export type AvailableSlotsResult =
  | { slots: Slot[]; preferredAvailable?: boolean; alternatives: Slot[] }
  | { slots: []; closed: true }
  | { slots: []; outOfWindow: true };

/**
 * PRD §7 slot engine entry point.
 * No auth inside: public booking (Phase 2) calls it openly with rate limits;
 * hub callers enforce centre scope before calling.
 */
export async function getAvailableSlots(opts: {
  centreServiceId: string;
  date: string; // YYYY-MM-DD centre-local
  preferredTime?: string; // "HH:mm"
  now?: Date;
}): Promise<AvailableSlotsResult> {
  const now = opts.now ?? new Date();
  const cs = await prisma.centreService.findUnique({
    where: { id: opts.centreServiceId },
    include: { centre: true, rules: true },
  });
  if (!cs || !cs.isActive || !cs.centre.isActive) return { slots: [], closed: true };
  const service = cs;

  const tz = service.centre.timezone;
  const todayStr = toDateStrInZone(now, tz);
  if (opts.date < todayStr || opts.date > addDaysStr(todayStr, service.centre.bookingWindowDays)) {
    return { slots: [], outOfWindow: true };
  }

  const [holidays, allClosures] = await Promise.all([
    prisma.holiday.findMany({
      where: { OR: [{ centreId: null }, { centreId: service.centreId }] },
      select: { date: true },
    }),
    prisma.closure.findMany({ where: { centreId: service.centreId } }),
  ]);
  const holidayStrs = holidays.map((h) => h.date.toISOString().slice(0, 10));
  const closureRanges: ClosureRange[] = allClosures
    .filter((c) => c.resourceId === null || c.resourceId === service.resourceId)
    .map((c) => ({
      startsOn: c.startsOn.toISOString().slice(0, 10),
      endsOn: c.endsOn.toISOString().slice(0, 10),
    }));

  const rules = service.rules.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startMinute: r.startMinute,
    endMinute: r.endMinute,
  }));

  async function computeDay(dateStr: string): Promise<Slot[]> {
    const dayStart = localToUtc(dateStr, 0, tz);
    const dayEnd = localToUtc(dateStr, 24 * 60, tz);
    // Resource-bound services count against the resource across all services (PRD §7 step 3).
    const appts = await prisma.appointment.findMany({
      where: {
        ...(service.resourceId ? { resourceId: service.resourceId } : { centreServiceId: service.id }),
        startsAt: { gte: dayStart, lt: dayEnd },
        status: { in: ACTIVE_STATUSES },
        deletedAt: null,
      },
      select: { startsAt: true },
    });
    const counts: Record<string, number> = {};
    for (const a of appts) {
      const key = minutesToHHmm(utcToLocalMinutes(a.startsAt, tz));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return generateSlotsForDay({
      date: dateStr,
      timeZone: tz,
      rules,
      slotMinutes: service.slotMinutes,
      capacityPerSlot: service.capacityPerSlot,
      bookedCounts: counts,
      minLeadMinutes: service.centre.minLeadMinutes,
      now,
      holidays: holidayStrs,
      closures: closureRanges,
    });
  }

  const slots = await computeDay(opts.date);

  if (!opts.preferredTime) return { slots, alternatives: [] };
  if (slots.some((s) => s.start === opts.preferredTime)) {
    return { slots, preferredAvailable: true, alternatives: [] };
  }

  // Preferred full: same-day nearest first, then adjacent days up to ±3 (PRD §7 step 6).
  const alternatives: Slot[] = nearestSlots(slots, opts.preferredTime, 3);
  for (let offset = 1; offset <= 3 && alternatives.length < 6; offset++) {
    for (const dateStr of [addDaysStr(opts.date, offset), addDaysStr(opts.date, -offset)]) {
      if (dateStr < todayStr || dateStr > addDaysStr(todayStr, service.centre.bookingWindowDays)) continue;
      const daySlots = await computeDay(dateStr);
      for (const s of daySlots) {
        if (alternatives.length >= 6) break;
        alternatives.push(s);
      }
      if (alternatives.length >= 3) break;
    }
  }
  return { slots, preferredAvailable: false, alternatives };
}

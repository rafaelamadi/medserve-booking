import { isClosedDay } from "./isClosedDay";
import { hhmmToMinutes, localToUtc, minutesToHHmm, weekdayOf } from "./timezone";
import type { GenerateDayInput, Slot } from "../model/types";

/**
 * PRD §7 steps 2–6 (pure): generate slots for one centre-local date,
 * applying capacity, past-slot and lead-time exclusion.
 */
export function generateSlotsForDay(input: GenerateDayInput): Slot[] {
  const {
    date,
    timeZone,
    rules,
    slotMinutes,
    capacityPerSlot,
    bookedCounts,
    minLeadMinutes,
    now,
    holidays = [],
    closures = [],
  } = input;

  const weekday = weekdayOf(date);
  if (isClosedDay({ date, weekday, rules, holidays, closures }).closed) return [];

  const leadCutoff = now.getTime() + minLeadMinutes * 60_000;
  const dayRules = rules
    .filter((r) => r.dayOfWeek === weekday)
    .sort((a, b) => a.startMinute - b.startMinute);

  const slots: Slot[] = [];
  for (const rule of dayRules) {
    for (let t = rule.startMinute; t + slotMinutes <= rule.endMinute; t += slotMinutes) {
      const startsAt = localToUtc(date, t, timeZone);
      if (startsAt.getTime() < leadCutoff) continue; // past or inside lead time
      const key = minutesToHHmm(t);
      const remaining = capacityPerSlot - (bookedCounts[key] ?? 0);
      if (remaining <= 0) continue; // full
      slots.push({
        start: key,
        startsAt,
        endsAt: localToUtc(date, t + slotMinutes, timeZone),
        remaining,
      });
    }
  }
  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Nearest available alternatives to a full preferred time (same day). */
export function nearestSlots(slots: Slot[], preferred: string, n = 3): Slot[] {
  const pm = hhmmToMinutes(preferred);
  return [...slots]
    .sort(
      (a, b) => Math.abs(hhmmToMinutes(a.start) - pm) - Math.abs(hhmmToMinutes(b.start) - pm),
    )
    .slice(0, n);
}

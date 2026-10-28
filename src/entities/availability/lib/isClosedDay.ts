import type { ClosureRange, DayRule } from "../model/types";

export type ClosedReason = "holiday" | "closure" | "no-hours";

/**
 * PRD §7 step 1: a date offers no slots when it is a holiday, inside a
 * closure, or has no availability rules (covers weekends without weekend hours).
 */
export function isClosedDay(opts: {
  date: string; // YYYY-MM-DD
  weekday: number; // 0 = Sunday ... 6 = Saturday
  rules: DayRule[];
  holidays?: string[];
  closures?: ClosureRange[];
}): { closed: boolean; reason?: ClosedReason } {
  const { date, weekday, rules, holidays = [], closures = [] } = opts;
  if (holidays.includes(date)) return { closed: true, reason: "holiday" };
  if (closures.some((c) => c.startsOn <= date && date <= c.endsOn)) {
    return { closed: true, reason: "closure" };
  }
  if (!rules.some((r) => r.dayOfWeek === weekday)) {
    return { closed: true, reason: "no-hours" };
  }
  return { closed: false };
}

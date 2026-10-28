import { weekdayOf } from "@/shared/lib/dates";
import type { ClosedData } from "../model/types";

export type ClosedReason = "weekend" | "holiday" | "closure";

/** Single closed-day rule shared by generation, shifting and flagging. */
export function closedReasonOn(date: string, closed: ClosedData): ClosedReason | null {
  const wd = weekdayOf(date);
  if (wd === 0 || wd === 6) return "weekend";
  if (closed.holidays.includes(date)) return "holiday";
  if (closed.closures.some((c) => c.startsOn <= date && date <= c.endsOn)) return "closure";
  return null;
}

export function isClosedDate(date: string, closed: ClosedData): boolean {
  return closedReasonOn(date, closed) !== null;
}

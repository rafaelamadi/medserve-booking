import { addDaysStr } from "@/shared/lib/dates";
import type { ClosedData } from "../model/types";
import { isClosedDate } from "./closedDay";

export type ShiftPlanItem = { id: string; oldDate: string; newDate: string; adjusted: boolean };

/**
 * FR-S6 shift-all planner (pure): move remaining sessions by delta days,
 * preserving spacing; landings on closed days push forward to the next open
 * day so order is preserved.
 */
export function planShiftRemaining(
  items: Array<{ id: string; date: string }>,
  fromDate: string,
  deltaDays: number,
  closed: ClosedData,
): ShiftPlanItem[] {
  if (deltaDays === 0) throw new Error("Shift must move at least one day");
  return items
    .filter((i) => i.date >= fromDate)
    .map((i) => {
      let target = addDaysStr(i.date, deltaDays);
      let adjusted = false;
      for (let guard = 0; isClosedDate(target, closed) && guard < 366; guard++) {
        target = addDaysStr(target, 1);
        adjusted = true;
      }
      return { id: i.id, oldDate: i.date, newDate: target, adjusted };
    });
}

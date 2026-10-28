import { addDaysStr } from "@/shared/lib/dates";
import type {
  ClosedData,
  GeneratedSession,
  GenerateSeriesInput,
  GenerateSeriesOutput,
  SkippedDay,
} from "../model/types";
import { closedReasonOn } from "./closedDay";

function closedReason(date: string, closed: ClosedData): SkippedDay["reason"] | null {
  return closedReasonOn(date, closed);
}

function nextOpen(date: string, closed: ClosedData): { date: string; moved: boolean } {
  let d = date;
  let moved = false;
  for (let i = 0; i < 366; i++) {
    if (!closedReason(d, closed)) return { date: d, moved };
    d = addDaysStr(d, 1);
    moved = true;
  }
  throw new Error("No open day within a year");
}

/**
 * PRD FR-S3: recurring schedule generator (pure).
 * - DAILY_WORKING_DAYS: take Mon–Fri open days until totalSessions.
 * - EVERY_N_DAYS / EVERY_N_WEEKS: targets moved to next open day (adjustment shown).
 * - CUSTOM_DATES: used as-is (closed dates flagged by the caller as warnings).
 */
export function generateSeries(input: GenerateSeriesInput): GenerateSeriesOutput {
  const { pattern, intervalN, totalSessions, startDate, customDates, closed } = input;
  const sessions: GeneratedSession[] = [];
  const skipped: SkippedDay[] = [];
  const seenSkipped = new Set<string>();
  const markSkipped = (date: string) => {
    const reason = closedReason(date, closed);
    if (reason && !seenSkipped.has(date)) {
      seenSkipped.add(date);
      skipped.push({ date, reason });
    }
  };

  if (pattern === "CUSTOM_DATES") {
    const dates = [...(customDates ?? [])].sort();
    if (dates.length === 0) throw new Error("Custom dates are required");
    for (const date of dates) sessions.push({ date });
    return { sessions, skipped };
  }

  if (pattern === "DAILY_WORKING_DAYS") {
    if (totalSessions < 1) throw new Error("Session count is required");
    let d = startDate;
    for (let guard = 0; sessions.length < totalSessions && guard < 366; guard++) {
      if (closedReason(d, closed)) markSkipped(d);
      else sessions.push({ date: d });
      d = addDaysStr(d, 1);
    }
    if (sessions.length < totalSessions) throw new Error("Not enough open days within a year");
    return { sessions, skipped };
  }

  if (!intervalN || intervalN < 1) throw new Error("Interval is required");
  if (totalSessions < 1) throw new Error("Session count is required");
  const step = pattern === "EVERY_N_WEEKS" ? intervalN * 7 : intervalN;
  // Anchor the cadence on the start date (moved if closed).
  const first = nextOpen(startDate, closed);
  if (first.moved) markSkipped(startDate);
  const anchor = first.date;
  for (let k = 0; k < totalSessions; k++) {
    const target = k === 0 ? anchor : addDaysStr(anchor, step * k);
    const open = nextOpen(target, closed);
    if (open.moved) markSkipped(target);
    sessions.push(open.moved ? { date: open.date, adjustedFrom: target } : { date: open.date });
  }
  return { sessions, skipped };
}

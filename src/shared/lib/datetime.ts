/**
 * Date/time helpers — PRD FR-X2: store UTC, display in centre timezone.
 * Default Africa/Lagos.
 */

export const DEFAULT_TIMEZONE = "Africa/Lagos";

export function toCentreLocal(dateUtc: Date, timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dateUtc);
}

export function startOfDayInZone(date: Date, timeZone = DEFAULT_TIMEZONE): Date {
  // Returns UTC instant for midnight in the given zone (approx via locale parts).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${parts}T00:00:00Z`);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Pure date/time helpers shared across slices.
 * Slot math is done in centre-local wall time; instants are UTC Dates.
 */

/** 0 = Sunday ... 6 = Saturday, for a YYYY-MM-DD calendar date. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Add calendar days to a YYYY-MM-DD string. */
export function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function minutesToHHmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function tzOffsetMs(timeZone: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - date.getTime();
}

/** Centre-local wall time (date + minutes) → UTC instant. */
export function localToUtc(dateStr: string, minutes: number, timeZone: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const base = Date.UTC(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Two passes so DST transitions converge (Africa/Lagos is fixed +1, converges immediately).
  const once = base - tzOffsetMs(timeZone, new Date(base));
  const twice = base - tzOffsetMs(timeZone, new Date(once));
  return new Date(twice);
}

/** UTC instant → minutes from midnight in the given zone. */
export function utcToLocalMinutes(date: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}

/** YYYY-MM-DD of an instant in the given zone. */
export function toDateStrInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

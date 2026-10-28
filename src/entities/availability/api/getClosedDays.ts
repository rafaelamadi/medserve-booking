import { prisma } from "@/shared/api/prisma";
import { isClosedDay } from "../lib/isClosedDay";
import { weekdayOf } from "../lib/timezone";

/**
 * FR-B3 support: closed dates for one month so the date picker never offers
 * closed days. Pure calendar math (no appointment counts) — cheap to cache.
 */
export async function getClosedDays(centreServiceId: string, yearMonth: string): Promise<string[]> {
  const cs = await prisma.centreService.findUnique({
    where: { id: centreServiceId },
    include: { centre: true, rules: true },
  });
  if (!cs || !cs.isActive || !cs.centre.isActive) return [];
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return [];

  const holidays = await prisma.holiday.findMany({
    where: { OR: [{ centreId: null }, { centreId: cs.centreId }] },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const closures = await prisma.closure.findMany({ where: { centreId: cs.centreId } });
  const ranges = closures
    .filter((c) => c.resourceId === null || c.resourceId === cs.resourceId)
    .map((c) => ({
      startsOn: c.startsOn.toISOString().slice(0, 10),
      endsOn: c.endsOn.toISOString().slice(0, 10),
    }));
  const rules = cs.rules.map((r) => ({ dayOfWeek: r.dayOfWeek, startMinute: r.startMinute, endMinute: r.endMinute }));

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const closed: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
    if (isClosedDay({ date: dateStr, weekday: weekdayOf(dateStr), rules, holidays: [...holidaySet], closures: ranges }).closed) {
      closed.push(dateStr);
    }
  }
  return closed;
}

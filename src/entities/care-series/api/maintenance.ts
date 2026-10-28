import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { isClosedDate } from "../lib/closedDay";
import { toDateStrInZone } from "@/shared/lib/dates";

type Db = Prisma.TransactionClient | typeof prisma;

async function closedFor(db: Db, centreId: string, resourceId: string | null) {
  const [holidays, closures] = await Promise.all([
    db.holiday.findMany({
      where: { OR: [{ centreId: null }, { centreId }] },
      select: { date: true },
    }),
    db.closure.findMany({ where: { centreId } }),
  ]);
  return {
    holidays: holidays.map((h) => h.date.toISOString().slice(0, 10)),
    closures: closures
      .filter((c) => c.resourceId === null || c.resourceId === resourceId)
      .map((c) => ({
        startsOn: c.startsOn.toISOString().slice(0, 10),
        endsOn: c.endsOn.toISOString().slice(0, 10),
      })),
  };
}

/** Recompute one session's flag against the current calendar. */
export async function refreshSessionFlag(db: Db, appointmentId: string): Promise<void> {
  const a = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { centre: { select: { timezone: true } } },
  });
  if (!a || !a.careSeriesId || a.deletedAt) return;
  const terminal = ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status);
  const closed = await closedFor(db, a.centreId, a.resourceId);
  const flag =
    !terminal && isClosedDate(toDateStrInZone(a.startsAt, a.centre.timezone), closed);
  if (a.needsAttention !== flag) {
    await db.appointment.update({ where: { id: a.id }, data: { needsAttention: flag } });
  }
}

/** FR-S6: flag series sessions falling on a new holiday. */
export async function flagSessionsForHoliday(date: string, centreId: string | null): Promise<number> {
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(`${date}T23:59:59Z`);
  // Centre-local boundaries vary by tz; use a 48h window then filter precisely.
  const wide = await prisma.appointment.findMany({
    where: {
      careSeriesId: { not: null },
      deletedAt: null,
      status: { notIn: ["COMPLETED", "NO_SHOW", "CANCELLED"] },
      centreId: centreId ?? undefined,
      startsAt: { gte: new Date(dayStart.getTime() - 24 * 3600_000), lt: new Date(dayEnd.getTime() + 24 * 3600_000) },
    },
    include: { centre: { select: { timezone: true } } },
  });
  let flagged = 0;
  for (const a of wide) {
    if (toDateStrInZone(a.startsAt, a.centre.timezone) !== date) continue;
    await prisma.appointment.update({ where: { id: a.id }, data: { needsAttention: true } });
    flagged++;
  }
  return flagged;
}

/** FR-S6: flag series sessions inside a new closure range. */
export async function flagSessionsForClosure(input: {
  centreId: string;
  startsOn: string;
  endsOn: string;
  resourceId: string | null;
}): Promise<number> {
  const from = new Date(`${input.startsOn}T00:00:00Z`).getTime() - 24 * 3600_000;
  const to = new Date(`${input.endsOn}T23:59:59Z`).getTime() + 24 * 3600_000;
  const cands = await prisma.appointment.findMany({
    where: {
      careSeriesId: { not: null },
      deletedAt: null,
      status: { notIn: ["COMPLETED", "NO_SHOW", "CANCELLED"] },
      centreId: input.centreId,
      resourceId: input.resourceId ?? undefined,
      startsAt: { gte: new Date(from), lt: new Date(to) },
    },
    include: { centre: { select: { timezone: true } } },
  });
  let flagged = 0;
  for (const a of cands) {
    const d = toDateStrInZone(a.startsAt, a.centre.timezone);
    if (d < input.startsOn || d > input.endsOn) continue;
    // Centre-wide closure flags every session; resource closure only bound ones.
    if (input.resourceId && a.resourceId !== input.resourceId) continue;
    await prisma.appointment.update({ where: { id: a.id }, data: { needsAttention: true } });
    flagged++;
  }
  return flagged;
}

/** Flip a series to COMPLETED once every session is terminal. */
export async function refreshSeriesStatus(db: Db, seriesId: string): Promise<void> {
  const open = await db.appointment.count({
    where: {
      careSeriesId: seriesId,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "NO_SHOW", "CANCELLED"] },
    },
  });
  if (open === 0) {
    await db.careSeries.updateMany({ where: { id: seriesId, status: "ACTIVE" }, data: { status: "COMPLETED" } });
  }
}

/** Called after hub-side completions so series close out (FR-S). */
export async function refreshSeriesStatusForAppointment(appointmentId: string): Promise<void> {
  const a = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { careSeriesId: true },
  });
  if (a?.careSeriesId) await refreshSeriesStatus(prisma, a.careSeriesId);
}

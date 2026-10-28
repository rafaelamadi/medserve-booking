"use server";

import { prisma } from "@/shared/api/prisma";
import { localToUtc, minutesToHHmm } from "@/shared/lib/dates";
import { getStaffSession } from "@/shared/lib/auth";
import { generateSeries } from "../lib/generateSeries";
import type { SeriesPattern } from "../model/types";

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;

export type PreviewInput = {
  centreServiceId: string;
  pattern: SeriesPattern;
  intervalN?: number;
  totalSessions: number;
  startDate: string;
  sessionTime: string; // "HH:MM"
  customDates?: string[];
};

export type PreviewSession = {
  date: string;
  time: string;
  adjustedFrom?: string;
  conflict: boolean;
};

/**
 * FR-S3/S4: series preview with skipped-day markers and per-session conflict
 * detection. Staff resolve conflicts before confirming (FR-S4).
 */
export async function previewSeries(input: PreviewInput) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const cs = await prisma.centreService.findUnique({
    where: { id: input.centreServiceId },
    include: { centre: true, service: true, rules: true },
  });
  if (!cs || !cs.isActive) throw new Error("Service unavailable");
  if (s.role !== "SUPER_ADMIN" && !s.centreIds.includes(cs.centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  if (!cs.service.supportsSeries) throw new Error("Service does not support series");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.sessionTime)) throw new Error("Bad session time");

  const [holidays, closures] = await Promise.all([
    prisma.holiday.findMany({
      where: { OR: [{ centreId: null }, { centreId: cs.centreId }] },
      select: { date: true },
    }),
    prisma.closure.findMany({ where: { centreId: cs.centreId } }),
  ]);
  const closed = {
    holidays: holidays.map((h) => h.date.toISOString().slice(0, 10)),
    closures: closures
      .filter((c) => c.resourceId === null || c.resourceId === cs.resourceId)
      .map((c) => ({
        startsOn: c.startsOn.toISOString().slice(0, 10),
        endsOn: c.endsOn.toISOString().slice(0, 10),
      })),
  };
  const { sessions, skipped } = generateSeries({
    pattern: input.pattern,
    intervalN: input.intervalN,
    totalSessions: input.totalSessions,
    startDate: input.startDate,
    customDates: input.customDates,
    closed,
  });

  const [sh, sm] = input.sessionTime.split(":").map(Number);
  const sessionMinute = sh * 60 + sm;
  const out: PreviewSession[] = [];
  for (const sess of sessions) {
    const start = localToUtc(sess.date, sessionMinute, cs.centre.timezone);
    const end = new Date(start.getTime() + cs.slotMinutes * 60_000);
    const taken = await prisma.appointment.count({
      where: {
        ...(cs.resourceId ? { resourceId: cs.resourceId } : { centreServiceId: cs.id }),
        startsAt: { gte: start, lt: end },
        status: { in: [...ACTIVE] },
        deletedAt: null,
      },
    });
    out.push({
      date: sess.date,
      time: minutesToHHmm(sessionMinute),
      adjustedFrom: sess.adjustedFrom,
      conflict: taken >= cs.capacityPerSlot,
    });
  }
  return { sessions: out, skipped };
}

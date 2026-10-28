import type { Prisma, StaffRole } from "@prisma/client";
import { planShiftRemaining } from "@/entities/care-series";
import { isClosedDate } from "@/entities/care-series/lib/closedDay";
import { enqueueNotification } from "@/entities/notification";
import { prismaDirect } from "@/shared/api/prisma";
import { localToUtc, toDateStrInZone, utcToLocalMinutes } from "@/shared/lib/dates";

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;
const TERMINAL = ["COMPLETED", "NO_SHOW", "CANCELLED"] as const;

export type SeriesStaff = { staffId: string; role: StaffRole; centreIds: string[] };

function gate(role: StaffRole) {
  if (!["CLINICIAN", "CENTRE_MANAGER", "SUPER_ADMIN"].includes(role)) {
    throw new Error("Forbidden: only clinicians and managers manage series");
  }
}

function scopeCheck(staff: SeriesStaff, centreId: string) {
  if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(centreId)) {
    throw new Error("Forbidden: centre scope");
  }
}

type Loaded = {
  series: { id: string; status: string };
  cs: {
    id: string;
    centreId: string;
    slotMinutes: number;
    capacityPerSlot: number;
    resourceId: string | null;
    centre: { timezone: string };
  };
};

async function loadSeries(tx: Prisma.TransactionClient, seriesId: string, staff: SeriesStaff): Promise<Loaded> {
  const series = await tx.careSeries.findUnique({
    where: { id: seriesId },
    include: { centreService: { include: { centre: true } } },
  });
  if (!series) throw new Error("Series not found");
  gate(staff.role);
  scopeCheck(staff, series.centreService.centreId);
  if (series.status !== "ACTIVE") throw new Error("Series is not active");
  return { series, cs: series.centreService };
}

async function closedData(tx: Prisma.TransactionClient, centreId: string, resourceId: string | null) {
  const [holidays, closures] = await Promise.all([
    tx.holiday.findMany({ where: { OR: [{ centreId: null }, { centreId }] }, select: { date: true } }),
    tx.closure.findMany({ where: { centreId } }),
  ]);
  return {
    holidays: holidays.map((h) => h.date.toISOString().slice(0, 10)),
    closures: closures
      .filter((c) => c.resourceId === null || c.resourceId === resourceId)
      .map((c) => ({ startsOn: c.startsOn.toISOString().slice(0, 10), endsOn: c.endsOn.toISOString().slice(0, 10) })),
  };
}

async function assertCapacity(
  tx: Prisma.TransactionClient,
  cs: Loaded["cs"],
  startsAt: Date,
  excludeId?: string,
) {
  const end = new Date(startsAt.getTime() + cs.slotMinutes * 60_000);
  const taken = await tx.appointment.count({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(cs.resourceId ? { resourceId: cs.resourceId } : { centreServiceId: cs.id }),
      startsAt: { gte: startsAt, lt: end },
      status: { in: [...ACTIVE] },
      deletedAt: null,
    },
  });
  if (taken >= cs.capacityPerSlot) throw new Error("That time is full");
}

async function notifyChanged(
  tx: Prisma.TransactionClient,
  appointmentId: string,
  patientId: string,
  patientEmail: string | null,
) {
  await enqueueNotification(tx, {
    appointmentId, patientId, templateKey: "SERIES_CHANGED", channel: "SMS", isChange: true,
  });
  if (patientEmail) {
    await enqueueNotification(tx, {
      appointmentId, patientId, templateKey: "SERIES_CHANGED", channel: "EMAIL", isChange: true,
    });
  }
}

async function seriesChange(
  tx: Prisma.TransactionClient,
  seriesId: string,
  kind: "RESCHEDULE" | "CANCEL" | "ADD_SESSION" | "SHIFT_ALL",
  staffId: string,
  reason?: string,
) {
  return tx.scheduleChange.create({
    data: { careSeriesId: seriesId, kind, initiatedBy: "STAFF", staffId, reason: reason?.trim() || undefined },
  });
}

function audit(tx: Prisma.TransactionClient, staffId: string, seriesId: string, action: string, after?: unknown) {
  return tx.auditLog.create({
    data: {
      actorType: "STAFF", staffId, entityType: "CareSeries", entityId: seriesId, action,
      after: (after ?? null) as Prisma.InputJsonValue,
    },
  });
}

/** FR-S6: shift one session (time-of-day preserved). */
export async function shiftOneSessionService(
  appointmentId: string,
  newDate: string,
  reason: string | undefined,
  staff: SeriesStaff,
) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appt?.careSeriesId || appt.deletedAt) throw new Error("Session not found");
    if ((TERMINAL as readonly string[]).includes(appt.status)) throw new Error("Session is closed");
    const { cs } = await loadSeries(tx, appt.careSeriesId, staff);
    const closed = await closedData(tx, cs.centreId, cs.resourceId);
    if (isClosedDate(newDate, closed)) throw new Error("New date falls on a closed day");
    const origMin = utcToLocalMinutes(appt.startsAt, cs.centre.timezone);
    const newStartsAt = localToUtc(newDate, origMin, cs.centre.timezone);
    await assertCapacity(tx, cs, newStartsAt, appt.id);

    const oldDate = toDateStrInZone(appt.startsAt, cs.centre.timezone);
    await tx.appointment.update({
      where: { id: appt.id },
      data: {
        startsAt: newStartsAt,
        endsAt: new Date(newStartsAt.getTime() + cs.slotMinutes * 60_000),
        needsAttention: false, // moved off any flagged day (closed dates rejected above)
      },
    });
    await tx.scheduleChange.create({
      data: {
        appointmentId: appt.id, kind: "RESCHEDULE", initiatedBy: "STAFF",
        staffId: staff.staffId, oldStartsAt: appt.startsAt, newStartsAt, reason: reason?.trim() || undefined,
      },
    });
    await seriesChange(tx, appt.careSeriesId, "RESCHEDULE", staff.staffId, reason);
    await audit(tx, staff.staffId, appt.careSeriesId, "shift-one", { from: oldDate, to: newDate });
    await notifyChanged(tx, appt.id, appt.patientId, appt.patient.email);
    return { ok: true as const };
  }, { isolationLevel: "Serializable", timeout: 30_000 });
}

/** FR-S6: shift all remaining sessions (one consolidated notice). */
export async function shiftRemainingService(
  seriesId: string,
  fromDate: string,
  deltaDays: number,
  reason: string | undefined,
  staff: SeriesStaff,
) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    const { cs } = await loadSeries(tx, seriesId, staff);
    const sessions = await tx.appointment.findMany({
      where: {
        careSeriesId: seriesId, deletedAt: null,
        status: { notIn: [...TERMINAL] },
        startsAt: { gte: new Date(`${fromDate}T00:00:00Z`) },
      },
      orderBy: { startsAt: "asc" },
    });
    if (sessions.length === 0) throw new Error("No remaining sessions");
    const closed = await closedData(tx, cs.centreId, cs.resourceId);
    const items = sessions.map((s) => ({
      id: s.id,
      date: toDateStrInZone(s.startsAt, cs.centre.timezone),
    }));
    const plan = planShiftRemaining(items, fromDate, deltaDays, closed);
    const shiftingIds = new Set(plan.map((p) => p.id));
    const byId = new Map(sessions.map((s) => [s.id, s]));
    // Batch the capacity pre-check into ONE ranged read (long transactions
    // time out over the cloud DB): bucket existing occupancy per slot start.
    const computed = plan.map((p) => {
      const orig = byId.get(p.id);
      if (!orig) throw new Error("Session vanished");
      const origMin = utcToLocalMinutes(orig.startsAt, cs.centre.timezone);
      const start = localToUtc(p.newDate, origMin, cs.centre.timezone);
      return { p, orig, start, end: new Date(start.getTime() + cs.slotMinutes * 60_000) };
    });
    const lo = new Date(Math.min(...computed.map((c) => c.start.getTime())));
    const hi = new Date(Math.max(...computed.map((c) => c.end.getTime())));
    const occupants = await tx.appointment.findMany({
      where: {
        id: { notIn: [...shiftingIds] },
        ...(cs.resourceId ? { resourceId: cs.resourceId } : { centreServiceId: cs.id }),
        startsAt: { gte: lo, lt: hi },
        status: { in: [...ACTIVE] },
        deletedAt: null,
      },
      select: { startsAt: true },
    });
    const bucket = new Map<string, number>();
    for (const o of occupants) {
      const k = o.startsAt.toISOString();
      bucket.set(k, (bucket.get(k) ?? 0) + 1);
    }
    const landed = new Map<string, number>();
    for (const c of computed) {
      const k = c.start.toISOString();
      const taken = (bucket.get(k) ?? 0) + (landed.get(k) ?? 0);
      if (taken >= cs.capacityPerSlot) throw new Error(`Conflict on ${c.p.newDate} — resolve it first`);
      landed.set(k, (landed.get(k) ?? 0) + 1);
    }
    for (const c of computed) {
      await tx.appointment.update({
        where: { id: c.p.id },
        data: {
          startsAt: c.start, endsAt: c.end,
          needsAttention: isClosedDate(c.p.newDate, closed),
        },
      });
      await tx.scheduleChange.create({
        data: {
          appointmentId: c.p.id, kind: "RESCHEDULE", initiatedBy: "STAFF",
          staffId: staff.staffId, oldStartsAt: c.orig.startsAt, newStartsAt: c.start,
          reason: reason?.trim() || undefined,
        },
      });
    }
    await seriesChange(tx, seriesId, "SHIFT_ALL", staff.staffId, reason);
    await audit(tx, staff.staffId, seriesId, "shift-all", { from: fromDate, deltaDays, count: plan.length });
    const first = sessions[0];
    const patient = await tx.patient.findUniqueOrThrow({ where: { id: first.patientId } });
    await notifyChanged(tx, first.id, first.patientId, patient.email);
    return { ok: true as const, count: plan.length };
  }, { isolationLevel: "Serializable", timeout: 60_000 });
}

/** FR-S6: append a session at the end. */
export async function addSessionService(
  seriesId: string,
  date: string,
  reason: string | undefined,
  staff: SeriesStaff,
) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    const { cs } = await loadSeries(tx, seriesId, staff);
    const closed = await closedData(tx, cs.centreId, cs.resourceId);
    if (isClosedDate(date, closed)) throw new Error("Date falls on a closed day");
    const existing = await tx.appointment.findMany({
      where: { careSeriesId: seriesId },
      select: { sequenceNo: true, patientId: true },
      orderBy: { sequenceNo: "desc" },
    });
    if (existing.length === 0) throw new Error("Series is empty");
    const series = await tx.careSeries.findUniqueOrThrow({ where: { id: seriesId } });
    const start = localToUtc(date, series.sessionMinute, cs.centre.timezone);
    await assertCapacity(tx, cs, start);
    const seq = Math.max(...existing.map((e) => e.sequenceNo ?? 0)) + 1;
    const created = await tx.appointment.create({
      data: {
        reference: await uniqueReference(tx, (await tx.centre.findUniqueOrThrow({ where: { id: cs.centreId } })).code),
        patientId: existing[0].patientId,
        centreId: cs.centreId,
        centreServiceId: cs.id,
        resourceId: cs.resourceId,
        careSeriesId: seriesId,
        sequenceNo: seq,
        startsAt: start,
        endsAt: new Date(start.getTime() + cs.slotMinutes * 60_000),
        requestedStartsAt: start,
        status: "CONFIRMED",
        source: "STAFF",
      },
    });
    await tx.careSeries.update({ where: { id: seriesId }, data: { totalSessions: { increment: 1 } } });
    await tx.scheduleChange.create({
      data: {
        appointmentId: created.id, kind: "ADD_SESSION", initiatedBy: "STAFF",
        staffId: staff.staffId, newStartsAt: start, reason: reason?.trim() || undefined,
      },
    });
    await seriesChange(tx, seriesId, "ADD_SESSION", staff.staffId, reason);
    await audit(tx, staff.staffId, seriesId, "add-session", { date });
    const patient = await tx.patient.findUniqueOrThrow({ where: { id: existing[0].patientId } });
    await notifyChanged(tx, created.id, created.patientId, patient.email);
    return { ok: true as const };
  }, { isolationLevel: "Serializable", timeout: 30_000 });
}

/** FR-S6: cancel one session. */
export async function cancelSessionService(
  appointmentId: string,
  reason: string | undefined,
  staff: SeriesStaff,
) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appt?.careSeriesId || appt.deletedAt) throw new Error("Session not found");
    if ((TERMINAL as readonly string[]).includes(appt.status)) throw new Error("Session is closed");
    await loadSeries(tx, appt.careSeriesId, staff);
    await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "CANCELLED", needsAttention: false },
    });
    await tx.scheduleChange.create({
      data: {
        appointmentId: appt.id, kind: "CANCEL", initiatedBy: "STAFF",
        staffId: staff.staffId, oldStartsAt: appt.startsAt, reason: reason?.trim() || undefined,
      },
    });
    await seriesChange(tx, appt.careSeriesId, "CANCEL", staff.staffId, reason);
    await audit(tx, staff.staffId, appt.careSeriesId, "cancel-session", { session: appt.sequenceNo });
    await tx.careSeries.update({ where: { id: appt.careSeriesId }, data: { totalSessions: { decrement: 1 } } });
    await refreshStatus(tx, appt.careSeriesId);
    await notifyChanged(tx, appt.id, appt.patientId, appt.patient.email);
    return { ok: true as const };
  }, { timeout: 30_000 });
}

/** FR-S6: cancel the whole series (one consolidated notice). */
export async function cancelSeriesService(seriesId: string, reason: string | undefined, staff: SeriesStaff) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    await loadSeries(tx, seriesId, staff);
    const remaining = await tx.appointment.findMany({
      where: { careSeriesId: seriesId, deletedAt: null, status: { notIn: [...TERMINAL] } },
      include: { patient: true },
    });
    await tx.appointment.updateMany({
      where: { id: { in: remaining.map((s) => s.id) } },
      data: { status: "CANCELLED", needsAttention: false },
    });
    await tx.scheduleChange.createMany({
      data: remaining.map((s) => ({
        appointmentId: s.id, kind: "CANCEL" as const, initiatedBy: "STAFF" as const,
        staffId: staff.staffId, oldStartsAt: s.startsAt, reason: reason?.trim() || undefined,
      })),
    });
    await tx.careSeries.update({ where: { id: seriesId }, data: { status: "CANCELLED" } });
    await seriesChange(tx, seriesId, "CANCEL", staff.staffId, reason);
    await audit(tx, staff.staffId, seriesId, "cancel-series", { sessions: remaining.length });
    if (remaining.length > 0) {
      await notifyChanged(tx, remaining[0].id, remaining[0].patientId, remaining[0].patient.email);
    }
    return { ok: true as const, count: remaining.length };
  }, { timeout: 60_000 });
}

/** FR-S8: series no-show raises a manager alert (flag + audit, no patient notice). */
export async function markSessionNoShowService(appointmentId: string, staff: SeriesStaff) {
  gate(staff.role);
  return prismaDirect.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt?.careSeriesId || appt.deletedAt) throw new Error("Session not found");
    if (appt.status !== "CONFIRMED" && appt.status !== "CHECKED_IN") {
      throw new Error("Only upcoming sessions can no-show");
    }
    await loadSeries(tx, appt.careSeriesId, staff);
    await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "NO_SHOW", needsAttention: true },
    });
    await tx.auditLog.create({
      data: {
        actorType: "STAFF", staffId: staff.staffId,
        entityType: "Appointment", entityId: appt.id,
        action: "series-no-show-alert",
        after: { series: appt.careSeriesId, sequence: appt.sequenceNo } as Prisma.InputJsonValue,
      },
    });
    await refreshStatus(tx, appt.careSeriesId);
    return { ok: true as const };
  }, { timeout: 30_000 });
}

async function refreshStatus(tx: Prisma.TransactionClient, seriesId: string) {
  const open = await tx.appointment.count({
    where: { careSeriesId: seriesId, deletedAt: null, status: { notIn: [...TERMINAL] } },
  });
  if (open === 0) {
    await tx.careSeries.updateMany({ where: { id: seriesId, status: "ACTIVE" }, data: { status: "COMPLETED" } });
  }
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

async function uniqueReference(tx: Prisma.TransactionClient, code: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    let tail = "";
    for (let j = 0; j < 6; j++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const candidate = `MS-${code}-${tail}`;
    const hit = await tx.appointment.findUnique({ where: { reference: candidate }, select: { id: true } });
    if (!hit) return candidate;
  }
  throw new Error("Could not mint a reference, retry");
}

import type { Prisma, StaffRole } from "@prisma/client";
import { generateSeries } from "@/entities/care-series";
import type { SeriesPattern } from "@/entities/care-series";
import { enqueueNotification } from "@/entities/notification";
import { findOrCreatePatientTx } from "@/entities/patient";
import { prismaDirect } from "@/shared/api/prisma";
import { hhmmToMinutes, localToUtc } from "@/shared/lib/dates";
import { normalizeNigerianPhone } from "@/shared/lib/phone";

const ACTIVE = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN"] as const;

export class SeriesConflictError extends Error {
  constructor(public dates: string[]) {
    super(`Conflicts on: ${dates.join(", ")} — resolve them before saving`);
  }
}

export type CreateSeriesInput = {
  centreServiceId: string;
  patient: { phone: string; fullName: string; email?: string };
  pattern: SeriesPattern;
  intervalN?: number;
  totalSessions: number;
  startDate: string;
  sessionTime: string; // "HH:MM"
  customDates?: string[];
  excludeDates?: string[];
};

export type StaffActor = { staffId: string; role: StaffRole; centreIds: string[] };

/**
 * FR-S1–S5 core (no session inside): hospital-set recurring schedule.
 * Role gate (FR-S, STAFF blocked) + centre scope enforced here so scripts
 * and actions share one path. The SERIES_CREATED notice is enqueued in the
 * same transaction — a series can never be saved without it (FR-S7).
 */
export async function createSeriesService(
  input: CreateSeriesInput,
  staff: StaffActor,
): Promise<{ seriesId: string; count: number }> {
  if (!["CLINICIAN", "CENTRE_MANAGER", "SUPER_ADMIN"].includes(staff.role)) {
    throw new Error("Forbidden: only clinicians and managers manage series");
  }
  const phone = normalizeNigerianPhone(input.patient.phone);
  if (!input.patient.fullName.trim()) throw new Error("Patient name is required");

  return prismaDirect.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const cs = await tx.centreService.findUnique({
        where: { id: input.centreServiceId },
        include: { centre: true, service: true },
      });
      if (!cs || !cs.isActive) throw new Error("Service unavailable");
      if (staff.role !== "SUPER_ADMIN" && !staff.centreIds.includes(cs.centreId)) {
        throw new Error("Forbidden: centre scope");
      }
      if (!cs.service.supportsSeries) throw new Error("Service does not support series");

      const [holidays, closures] = await Promise.all([
        tx.holiday.findMany({
          where: { OR: [{ centreId: null }, { centreId: cs.centreId }] },
          select: { date: true },
        }),
        tx.closure.findMany({ where: { centreId: cs.centreId } }),
      ]);
      const { sessions } = generateSeries({
        pattern: input.pattern,
        intervalN: input.intervalN,
        totalSessions: input.totalSessions,
        startDate: input.startDate,
        customDates: input.customDates,
        closed: {
          holidays: holidays.map((h) => h.date.toISOString().slice(0, 10)),
          closures: closures
            .filter((c) => c.resourceId === null || c.resourceId === cs.resourceId)
            .map((c) => ({
              startsOn: c.startsOn.toISOString().slice(0, 10),
              endsOn: c.endsOn.toISOString().slice(0, 10),
            })),
        },
      });
      const kept = sessions.filter((s) => !input.excludeDates?.includes(s.date));
      if (kept.length === 0) throw new Error("No sessions left after exclusions");

      const sessionMinute = hhmmToMinutes(input.sessionTime);
      const starts = kept.map((s) => localToUtc(s.date, sessionMinute, cs.centre.timezone));
      // One ranged read instead of N counts (long transactions time out over the cloud DB).
      const lo = new Date(Math.min(...starts.map((s) => s.getTime())));
      const hi = new Date(Math.max(...starts.map((s) => s.getTime() + cs.slotMinutes * 60_000)));
      const occupants = await tx.appointment.findMany({
        where: {
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
      const conflicts = kept
        .filter((_, i) => (bucket.get(starts[i].toISOString()) ?? 0) >= cs.capacityPerSlot)
        .map((s) => s.date);
      if (conflicts.length > 0) throw new SeriesConflictError(conflicts);

      const patient = await findOrCreatePatientTx(tx, {
        phone,
        fullName: input.patient.fullName.trim(),
        email: input.patient.email?.trim() ? input.patient.email.trim() : undefined,
      });
      const series = await tx.careSeries.create({
        data: {
          patientId: patient.id,
          centreServiceId: cs.id,
          createdById: staff.staffId,
          pattern: input.pattern,
          intervalN: input.intervalN,
          totalSessions: kept.length,
          startDate: new Date(`${kept[0].date}T00:00:00Z`),
          sessionMinute,
        },
      });
      const refs = await mintReferences(tx, cs.centre.code, kept.length);
      await tx.appointment.createMany({
        data: kept.map((s, i) => ({
          reference: refs[i],
          patientId: patient.id,
          centreId: cs.centreId,
          centreServiceId: cs.id,
          resourceId: cs.resourceId,
          careSeriesId: series.id,
          sequenceNo: i + 1,
          startsAt: starts[i],
          endsAt: new Date(starts[i].getTime() + cs.slotMinutes * 60_000),
          requestedStartsAt: starts[i],
          status: "CONFIRMED" as const,
          source: "STAFF" as const,
        })),
      });
      const firstSession = await tx.appointment.findFirstOrThrow({
        where: { careSeriesId: series.id, sequenceNo: 1 },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          actorType: "STAFF",
          staffId: staff.staffId,
          entityType: "CareSeries",
          entityId: series.id,
          action: "create",
          after: { sessions: kept.length, pattern: input.pattern } as Prisma.InputJsonValue,
        },
      });
      // FR-S5/S7: exactly ONE creation notice with the full schedule,
      // anchored on the first session (renderer expands the whole series).
      await enqueueNotification(tx, {
        appointmentId: firstSession.id,
        patientId: patient.id,
        templateKey: "SERIES_CREATED",
        channel: "SMS",
      });
      if (patient.email) {
        await enqueueNotification(tx, {
          appointmentId: firstSession.id,
          patientId: patient.id,
          templateKey: "SERIES_CREATED",
          channel: "EMAIL",
        });
      }
      return { seriesId: series.id, count: kept.length };
    },
    { isolationLevel: "Serializable", timeout: 60_000 },
  );
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function mint(): string {
  let tail = "";
  for (let j = 0; j < 6; j++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return tail;
}

/** Mint N collision-free references with batched checks (one query per round). */
async function mintReferences(tx: Prisma.TransactionClient, code: string, n: number): Promise<string[]> {
  const refs: string[] = [];
  for (let round = 0; round < 5 && refs.length < n; round++) {
    const cands = Array.from({ length: n - refs.length + 3 }, () => `MS-${code}-${mint()}`);
    const hits = await tx.appointment.findMany({
      where: { reference: { in: cands } },
      select: { reference: true },
    });
    const taken = new Set(hits.map((h) => h.reference));
    for (const c of cands) {
      if (refs.length >= n) break;
      if (!taken.has(c) && !refs.includes(c)) refs.push(c);
    }
  }
  if (refs.length < n) throw new Error("Could not mint references, retry");
  return refs;
}

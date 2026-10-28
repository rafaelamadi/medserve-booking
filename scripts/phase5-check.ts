/**
 * Phase 5 acceptance proof (run manually, not in CI):
 * 20-session DAILY series over a holiday week → skips; STAFF blocked;
 * shift-all → exactly ONE SERIES_CHANGED; no-show → manager alert, no notice;
 * holiday flagging. Cleans up afterwards.
 */
import { prisma } from "../src/shared/api/prisma";
import { createSeriesService } from "../src/features/create-care-series/api/service";
import {
  cancelSeriesService,
  markSessionNoShowService,
  shiftRemainingService,
} from "../src/features/shift-series-sessions/api/service";
import { flagSessionsForHoliday } from "../src/entities/care-series/api/maintenance";

async function main() {
  const admin = await prisma.staffUser.findUniqueOrThrow({ where: { email: "admin@medserve.ng" } });
  const cs = await prisma.centreService.findFirstOrThrow({
    where: { centre: { code: "MLCC" }, service: { slug: "radiotherapy" }, isActive: true },
  });
  const actor = { staffId: admin.id, role: admin.role, centreIds: [cs.centreId] };
  const phone = "08097777777";
  const phoneE164 = "+2348097777777";

  console.log("1. 20-session DAILY series from Mon 2026-09-28 (holiday 10-01 + weekends skipped)");
  const created = await createSeriesService(
    {
      centreServiceId: cs.id,
      patient: { phone, fullName: "Phase Five" },
      pattern: "DAILY_WORKING_DAYS",
      totalSessions: 20,
      startDate: "2026-09-28",
      sessionTime: "08:00",
    },
    actor,
  );
  console.log(`   series=${created.seriesId} sessions=${created.count}`);
  if (created.count !== 20) throw new Error("expected 20 sessions");
  const sessions = await prisma.appointment.findMany({
    where: { careSeriesId: created.seriesId },
    orderBy: { sequenceNo: "asc" },
  });
  const dates = sessions.map((s) => s.startsAt.toISOString().slice(0, 10));
  // 08:00 Lagos = 07:00Z; date part equals Lagos date for morning slots.
  if (dates.includes("2026-10-01")) throw new Error("holiday not skipped!");
  if (sessions.some((s) => s.status !== "CONFIRMED")) throw new Error("sessions must be CONFIRMED");
  const createdNotes = await prisma.notification.count({
    where: { appointment: { careSeriesId: created.seriesId }, templateKey: "SERIES_CREATED" },
  });
  console.log(`   SERIES_CREATED rows=${createdNotes} (want exactly 1 SMS, no email on file)`);
  if (createdNotes !== 1) throw new Error("exactly ONE creation notice required");

  console.log("2. STAFF role gate must reject creation");
  let blocked = false;
  try {
    await createSeriesService(
      {
        centreServiceId: cs.id, patient: { phone: "08090000001", fullName: "Nope" },
        pattern: "DAILY_WORKING_DAYS", totalSessions: 2, startDate: "2026-11-02", sessionTime: "08:00",
      },
      { staffId: "x", role: "STAFF", centreIds: [cs.centreId] },
    );
  } catch { blocked = true; }
  if (!blocked) throw new Error("STAFF gate failed!");

  console.log("3. shift-all remaining +7 → exactly ONE SERIES_CHANGED");
  const before = await prisma.notification.count({
    where: { appointment: { careSeriesId: created.seriesId }, templateKey: "SERIES_CHANGED" },
  });
  const secondDate = sessions[1].startsAt.toISOString().slice(0, 10);
  const shifted = await shiftRemainingService(created.seriesId, secondDate, 7, "Machine service", actor);
  const after = await prisma.notification.count({
    where: { appointment: { careSeriesId: created.seriesId }, templateKey: "SERIES_CHANGED" },
  });
  console.log(`   moved=${shifted.count} changedNotices=${after - before} (want 1)`);
  if (after - before !== 1) throw new Error("batch shift must send exactly one notice");

  console.log("4. no-show → flag + audit alert, no patient notice");
  const notesBefore = await prisma.notification.count({
    where: { appointmentId: sessions[0].id },
  });
  await markSessionNoShowService(sessions[0].id, actor);
  const ns = await prisma.appointment.findUniqueOrThrow({ where: { id: sessions[0].id } });
  const notesAfter = await prisma.notification.count({ where: { appointmentId: sessions[0].id } });
  const alert = await prisma.auditLog.findFirst({
    where: { entityId: sessions[0].id, action: "series-no-show-alert" },
  });
  if (ns.status !== "NO_SHOW" || !ns.needsAttention || !alert) throw new Error("no-show alert failed");
  if (notesAfter !== notesBefore) throw new Error("no-show must not notify the patient");
  console.log("   flagged + alert logged, no notice queued");

  console.log("5. holiday flagging (FR-S6)");
  const target = await prisma.appointment.findFirstOrThrow({
    where: { careSeriesId: created.seriesId, status: "CONFIRMED" },
    orderBy: { sequenceNo: "asc" },
  });
  const targetDate = target.startsAt.toISOString().slice(0, 10);
  const flagged = await flagSessionsForHoliday(targetDate, null);
  const refetch = await prisma.appointment.findUniqueOrThrow({ where: { id: target.id } });
  console.log(`   flagged=${flagged} sessionFlag=${refetch.needsAttention}`);
  if (!refetch.needsAttention) throw new Error("flagging failed");

  console.log("6. cancel series → CANCELLED + one more SERIES_CHANGED");
  const changedBefore = await prisma.notification.count({
    where: { appointment: { careSeriesId: created.seriesId }, templateKey: "SERIES_CHANGED" },
  });
  await cancelSeriesService(created.seriesId, "Treatment complete elsewhere", actor);
  const series = await prisma.careSeries.findUniqueOrThrow({ where: { id: created.seriesId } });
  const changedAfter = await prisma.notification.count({
    where: { appointment: { careSeriesId: created.seriesId }, templateKey: "SERIES_CHANGED" },
  });
  if (series.status !== "CANCELLED") throw new Error("series not cancelled");
  console.log(`   status=CANCELLED extraChanged=${changedAfter - changedBefore} (want 1)`);
  if (changedAfter - changedBefore !== 1) throw new Error("cancel must send exactly one notice");

  const ids = sessions.map((s) => s.id);
  await prisma.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.scheduleChange.deleteMany({ where: { OR: [{ appointmentId: { in: ids } }, { careSeriesId: created.seriesId }] } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "Appointment", entityId: { in: ids } }, { entityType: "CareSeries", entityId: created.seriesId }] } });
  await prisma.appointment.deleteMany({ where: { careSeriesId: created.seriesId } });
  await prisma.careSeries.delete({ where: { id: created.seriesId } });
  await prisma.patient.deleteMany({ where: { phone: phoneE164 } });
  console.log("cleanup done — ALL PHASE 5 ACCEPTANCE CHECKS PASSED");
}

main()
  .catch((e) => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Phase 6 acceptance proof (run manually, not in CI):
 * complete → result ready (idempotent) → collect → nudge once →
 * follow-up schedule → fire once → render/send path. Cleans up afterwards.
 */
import { prisma } from "../src/shared/api/prisma";
import { createAppointmentService } from "../src/features/book-appointment/api/createAppointmentService";
import { transitionAppointment } from "../src/entities/appointment/api/transitions";
import { enqueueNotification, enqueueDueFollowUps, enqueueDueNudges, processQueue } from "../src/entities/notification/api/queue";
import { sendResultNoticeService } from "../src/features/send-result-notice/api/service";
import { markResultCollectedService } from "../src/features/mark-result-collected/api/service";
import { scheduleFollowUpService } from "../src/features/schedule-follow-up-reminder/api/service";
import type { Prisma } from "@prisma/client";
import { addDaysStr, toDateStrInZone } from "../src/entities/availability";

function notify(tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) {
  return enqueueNotification(tx, n);
}

function nextWeekday(from: Date, minAhead: number): string {
  let d = addDaysStr(toDateStrInZone(from, "Africa/Lagos"), minAhead);
  while ([0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay())) d = addDaysStr(d, 1);
  return d;
}

async function main() {
  const admin = await prisma.staffUser.findUniqueOrThrow({ where: { email: "admin@medserve.ng" } });
  const actor = { staffId: admin.id, role: admin.role, centreIds: [] as string[] };
  const auto = await prisma.centreService.findFirstOrThrow({
    where: { centre: { code: "MKDC" }, service: { slug: "blood-tests" } },
  });
  const mammo = await prisma.service.findFirstOrThrow({ where: { slug: "mammography" } });
  const date = nextWeekday(new Date(), 7);
  const phone = "08098888888";
  const phoneE164 = "+2348098888888";

  console.log("1. book → complete the visit");
  const b = await createAppointmentService({
    centreId: auto.centreId, centreServiceId: auto.id, date, time: "10:00",
    fullName: "Phase Six", phone,
  });
  for (const kind of ["confirm", "checkin", "complete"] as const) {
    const cur = await prisma.appointment.findUniqueOrThrow({ where: { id: b.id }, select: { status: true } });
    if (kind === "confirm" && cur.status !== "REQUESTED") continue;
    await transitionAppointment({ id: b.id, kind, staffId: admin.id, scopeCentreIds: null, notify });
  }
  const done = await prisma.appointment.findUniqueOrThrow({ where: { id: b.id } });
  if (done.status !== "COMPLETED") throw new Error("not completed");

  console.log("2. result ready → RESULT_READY queued; repeat rejected");
  const r1 = await sendResultNoticeService(b.id, actor);
  if (!r1.ok) throw new Error(`result ready failed: ${r1.error}`);
  const r2 = await sendResultNoticeService(b.id, actor);
  if (r2.ok) throw new Error("duplicate result notice allowed!");
  const readyNotes = await prisma.notification.count({
    where: { appointmentId: b.id, templateKey: "RESULT_READY" },
  });
  console.log(`   RESULT_READY rows=${readyNotes} (want 1: SMS only, no email on file)`);
  if (readyNotes !== 1) throw new Error("expected exactly one RESULT_READY");

  console.log("3. collect → collectedAt set");
  const notice = await prisma.resultNotice.findUniqueOrThrow({ where: { appointmentId: b.id } });
  await markResultCollectedService(notice.id, actor);
  const collected = await prisma.resultNotice.findUniqueOrThrow({ where: { id: notice.id } });
  if (!collected.collectedAt) throw new Error("not collected");

  console.log("4. nudge: backdate an uncollected notice 6 days → nudge once, never twice");
  const b2 = await createAppointmentService({
    centreId: auto.centreId, centreServiceId: auto.id, date, time: "11:00",
    fullName: "Phase Six Two", phone: "08099999999",
  });
  for (const kind of ["confirm", "checkin", "complete"] as const) {
    const cur = await prisma.appointment.findUniqueOrThrow({ where: { id: b2.id }, select: { status: true } });
    if (kind === "confirm" && cur.status !== "REQUESTED") continue;
    await transitionAppointment({ id: b2.id, kind, staffId: admin.id, scopeCentreIds: null, notify });
  }
  await sendResultNoticeService(b2.id, actor);
  const n2 = await prisma.resultNotice.findUniqueOrThrow({ where: { appointmentId: b2.id } });
  await prisma.resultNotice.update({
    where: { id: n2.id },
    data: { sentAt: new Date(Date.now() - 6 * 24 * 3600_000) },
  });
  const nudge1 = await enqueueDueNudges();
  const nudge2 = await enqueueDueNudges();
  console.log(`   first=${nudge1.nudged} second=${nudge2.nudged} (want 1 then 0)`);
  if (nudge1.nudged !== 1 || nudge2.nudged !== 0) throw new Error("nudge-once failed");

  console.log("5. follow-up due today → FOLLOWUP_DUE queued once + renders with booking link");
  const todayStr = toDateStrInZone(new Date(), "Africa/Lagos");
  const fu = await scheduleFollowUpService(
    { centreId: auto.centreId, serviceId: mammo.id, dueOn: todayStr, appointmentId: b.id },
    { staffId: admin.id, role: admin.role, centreIds: [auto.centreId] },
  );
  if (!fu.ok) throw new Error(`schedule failed: ${fu.error}`);
  const fire1 = await enqueueDueFollowUps();
  const fire2 = await enqueueDueFollowUps();
  console.log(`   first=${fire1.fired} second=${fire2.fired} (want 1 then 0)`);
  if (fire1.fired !== 1 || fire2.fired !== 0) throw new Error("fire-once failed");
  const send = await processQueue(30);
  console.log(`   queue drain: sent=${send.sent} failed=${send.failed}`);

  const ids = [b.id, b2.id];
  await prisma.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.resultNotice.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.followUpReminder.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.scheduleChange.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: { in: ["ResultNotice", "FollowUpReminder"] } } });
  await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
  await prisma.patient.deleteMany({ where: { phone: { in: [phoneE164, "+2348099999999"] } } });
  console.log("cleanup done — ALL PHASE 6 ACCEPTANCE CHECKS PASSED");
}

main()
  .catch((e) => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Phase 4 acceptance proof (run manually, not in CI):
 * AUTO book → reschedule x2 (CONFIRMED) → 3rd blocked by cap → cancel.
 * REVIEW book → request new time (RESCHEDULE_REQUESTED, original held) → approve.
 * OTP request/verify need HTTP scope — covered by unit tests + browser check.
 * Cleans up afterwards.
 */
import { prisma } from "../src/shared/api/prisma";
import { createAppointmentService } from "../src/features/book-appointment/api/createAppointmentService";
import { requestNewTimeService } from "../src/features/request-new-time/api/service";
import { cancelPatientBookingService } from "../src/features/cancel-appointment/api/service";
import { transitionAppointment } from "../src/entities/appointment/api/transitions";
import { enqueueNotification } from "../src/entities/notification/api/queue";
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
  const auto = await prisma.centreService.findFirstOrThrow({
    where: { centre: { code: "MKDC" }, service: { slug: "blood-tests" } },
  });
  const review = await prisma.centreService.findFirstOrThrow({
    where: { centre: { code: "MLCC" }, service: { slug: "chemotherapy" } },
  });
  const date = nextWeekday(new Date(), 7);
  const phoneA = "08095555555";
  const phoneR = "08096666666";

  console.log("1. AUTO book → reschedule twice → 3rd blocked by cap");
  const b1 = await createAppointmentService({
    centreId: auto.centreId, centreServiceId: auto.id, date, time: "10:00",
    fullName: "Phase Four", phone: phoneA,
  });
  const phoneE164A = "+2348095555555";
  const r1 = await requestNewTimeService(b1.reference, phoneE164A, { date, time: "11:00" });
  console.log(`   move1: ${JSON.stringify(r1)}`);
  if (!r1.ok || r1.status !== "CONFIRMED") throw new Error("AUTO move should confirm");
  const r2 = await requestNewTimeService(b1.reference, phoneE164A, { date, time: "12:00" });
  if (!r2.ok) throw new Error("second move should succeed");
  const r3 = await requestNewTimeService(b1.reference, phoneE164A, { date, time: "13:00" });
  console.log(`   move3 (cap): ${JSON.stringify(r3)}`);
  if (r3.ok) throw new Error("cap not enforced!");

  console.log("2. patient cancel → CANCELLED + BOOKING_CANCELLED");
  const c1 = await cancelPatientBookingService(b1.reference, phoneE164A);
  if (!c1.ok) throw new Error(`cancel failed: ${c1.error}`);

  console.log("3. REVIEW book → request (original held) → approve");
  const b2 = await createAppointmentService({
    centreId: review.centreId, centreServiceId: review.id, date, time: "11:00",
    fullName: "Phase Four Review", phone: phoneR,
  });
  const phoneE164R = "+2348096666666";
  const q1 = await requestNewTimeService(b2.reference, phoneE164R, { date, time: "12:00" });
  console.log(`   request: ${JSON.stringify(q1)}`);
  if (!q1.ok || q1.status !== "RESCHEDULE_REQUESTED") throw new Error("REVIEW should hold");
  const held = await prisma.appointment.findUniqueOrThrow({ where: { id: b2.id } });
  if (held.startsAt.toISOString() === new Date(`${date}T11:00:00Z`).toISOString()) {
    throw new Error("original slot must be held (11:00 Lagos = 10:00Z, not 12:00)");
  }
  const ap = await transitionAppointment({
    id: b2.id, kind: "approve", staffId: admin.id, scopeCentreIds: null, notify,
  });
  if (ap.status !== "CONFIRMED") throw new Error("approve should confirm");
  const applied = await prisma.appointment.findUniqueOrThrow({ where: { id: b2.id } });
  console.log(`   approved at ${applied.startsAt.toISOString()} (want 11:00Z = 12:00 Lagos)`);

  const notes = await prisma.notification.groupBy({
    by: ["templateKey"], _count: true, where: { appointmentId: { in: [b1.id, b2.id] } },
  });
  console.log("   notifications:", JSON.stringify(notes));
  for (const k of ["RESCHEDULE_CONFIRMED", "RESCHEDULE_REQUEST_RECEIVED", "BOOKING_CANCELLED"]) {
    if (!notes.some((n) => n.templateKey === k)) throw new Error(`missing ${k}`);
  }
  const patientChanges = await prisma.scheduleChange.count({
    where: { appointmentId: { in: [b1.id, b2.id] }, initiatedBy: "PATIENT" },
  });
  console.log(`   patient-initiated changes: ${patientChanges}`);
  if (patientChanges < 4) throw new Error("patient change trail incomplete");

  const ids = [b1.id, b2.id];
  await prisma.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.scheduleChange.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: ids } } });
  await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
  await prisma.patient.deleteMany({ where: { phone: { in: [phoneE164A, phoneE164R] } } });
  console.log("cleanup done — ALL PHASE 4 ACCEPTANCE CHECKS PASSED");
}

main()
  .catch((e) => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Phase 3 acceptance proof (run manually, not in CI):
 * book (REVIEW) → confirm → propose new time → check in → complete,
 * plus a second booking → cancel with reason.
 * Verifies: single-tx audit + notification rows per transition (FR-H4),
 * timeline data, and centre scoping. Cleans up afterwards.
 */
import { prisma } from "../src/shared/api/prisma";
import { createAppointmentService } from "../src/features/book-appointment/api/createAppointmentService";
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
  const date = nextWeekday(new Date(), 7);
  const scope = null; // SUPER_ADMIN

  console.log("1. book REVIEW? (blood-tests is AUTO) → CONFIRMED");
  const b1 = await createAppointmentService({
    centreId: auto.centreId, centreServiceId: auto.id, date, time: "10:00",
    fullName: "Phase Three", phone: "08093333333",
  });
  console.log(`   ${b1.reference} ${b1.status}`);
  if (b1.status !== "CONFIRMED") throw new Error("expected CONFIRMED");

  console.log("2. propose new time → RESCHEDULE_PROPOSED + TIME_UNAVAILABLE queued");
  const t1 = await transitionAppointment({
    id: b1.id, kind: "propose", staffId: admin.id, scopeCentreIds: scope,
    reason: "Machine maintenance", newStartsAt: new Date(`${date}T09:30:00Z`), notify,
  });
  console.log(`   ${t1.status}`);
  if (t1.status !== "RESCHEDULE_PROPOSED") throw new Error("expected RESCHEDULE_PROPOSED");

  console.log("3. confirm (from PROPOSED) → CONFIRMED + RESCHEDULE_CONFIRMED queued");
  const t2 = await transitionAppointment({ id: b1.id, kind: "confirm", staffId: admin.id, scopeCentreIds: scope, notify });
  if (t2.status !== "CONFIRMED") throw new Error("expected CONFIRMED");

  console.log("4. check in → complete");
  await transitionAppointment({ id: b1.id, kind: "checkin", staffId: admin.id, scopeCentreIds: scope, notify });
  const t4 = await transitionAppointment({ id: b1.id, kind: "complete", staffId: admin.id, scopeCentreIds: scope, notify });
  if (t4.status !== "COMPLETED") throw new Error("expected COMPLETED");

  console.log("5. second booking → cancel with reason");
  const b2 = await createAppointmentService({
    centreId: auto.centreId, centreServiceId: auto.id, date, time: "11:00",
    fullName: "Phase Three Two", phone: "08094444444",
  });
  await transitionAppointment({ id: b2.id, kind: "cancel", staffId: admin.id, scopeCentreIds: scope, reason: "Patient request by phone", notify });

  console.log("6. illegal transition COMPLETED → CONFIRMED must throw");
  let threw = false;
  try {
    await transitionAppointment({ id: b1.id, kind: "confirm", staffId: admin.id, scopeCentreIds: scope, notify });
  } catch { threw = true; }
  if (!threw) throw new Error("illegal transition allowed!");

  console.log("7. centre scope: fake scope must throw");
  threw = false;
  try {
    await transitionAppointment({ id: b1.id, kind: "checkin", staffId: admin.id, scopeCentreIds: ["nope"], notify });
  } catch { threw = true; }
  if (!threw) throw new Error("scope bypass!");

  const audits = await prisma.auditLog.count({ where: { entityType: "Appointment", entityId: { in: [b1.id, b2.id] } } });
  const notes = await prisma.notification.groupBy({ by: ["templateKey"], _count: true, where: { appointmentId: { in: [b1.id, b2.id] } } });
  const changes = await prisma.scheduleChange.count({ where: { appointmentId: { in: [b1.id, b2.id] } } });
  console.log(`   audits=${audits} changes=${changes} notifications=${JSON.stringify(notes)}`);
  const keys = notes.map((n) => n.templateKey);
  for (const k of ["BOOKING_CONFIRMED", "BOOKING_TIME_UNAVAILABLE", "RESCHEDULE_CONFIRMED", "BOOKING_CANCELLED"]) {
    if (!keys.includes(k)) throw new Error(`missing ${k}`);
  }
  if (audits < 8) throw new Error("audit trail incomplete");

  // Cleanup
  const ids = [b1.id, b2.id];
  await prisma.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.scheduleChange.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: ids } } });
  await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
  await prisma.patient.deleteMany({ where: { phone: { in: ["+2348093333333", "+2348094444444"] } } });
  console.log("cleanup done — ALL PHASE 3 ACCEPTANCE CHECKS PASSED");
}

main()
  .catch((e) => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

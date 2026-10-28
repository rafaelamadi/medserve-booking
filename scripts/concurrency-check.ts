/**
 * Phase 2 acceptance proof (run manually, not in CI):
 * 1. 5 concurrent bookings on a capacity-1 AUTO slot → exactly 1 CONFIRMED, 4 SLOT_TAKEN.
 * 2. REVIEW booking → REQUESTED + BOOKING_RECEIVED queued.
 * 3. AUTO booking → CONFIRMED + BOOKING_CONFIRMED queued.
 * Cleans up all test rows afterwards.
 */
import { prisma } from "../src/shared/api/prisma";
import { createAppointmentService, SlotTakenError } from "../src/features/book-appointment/api/createAppointmentService";
import { addDaysStr, toDateStrInZone } from "../src/entities/availability";

function nextWeekday(from: Date, minAhead: number): string {
  let d = addDaysStr(toDateStrInZone(from, "Africa/Lagos"), minAhead);
  while ([0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay())) {
    d = addDaysStr(d, 1);
  }
  return d;
}

async function main() {
  const auto = await prisma.centreService.findFirst({
    where: { centre: { code: "MKDC" }, service: { slug: "blood-tests" }, isActive: true },
    include: { centre: true },
  });
  const review = await prisma.centreService.findFirst({
    where: { centre: { code: "MLCC" }, service: { slug: "chemotherapy" }, isActive: true },
    include: { centre: true },
  });
  if (!auto || !review) throw new Error("Seed data missing");
  const date = nextWeekday(new Date(), 7);
  const phones = Array.from({ length: 5 }, (_, i) => `0809000000${i}`);
  console.log(`AUTO race: ${auto.centre.code}/blood-tests ${date} 10:00, capacity ${auto.capacityPerSlot}`);

  const results = await Promise.allSettled(
    phones.map((phone, i) =>
      createAppointmentService({
        centreId: auto.centreId,
        centreServiceId: auto.id,
        date,
        time: "10:00",
        fullName: `Race Patient ${i}`,
        phone,
      }),
    ),
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  const taken = results.filter((r) => r.status === "rejected" && (r as PromiseRejectedResult).reason instanceof SlotTakenError);
  const other = results.filter((r) => r.status === "rejected" && !((r as PromiseRejectedResult).reason instanceof SlotTakenError));
  console.log(`  confirmed=${ok.length} slotTaken=${taken.length} other=${other.length}`);
  for (const o of other) console.log("  UNEXPECTED:", (o as PromiseRejectedResult).reason);
  if (ok.length !== 1 || taken.length !== 4) throw new Error("RACE ACCEPTANCE FAILED");

  const ref = (ok[0] as PromiseFulfilledResult<{ reference: string; status: string }>).value;
  console.log(`  winner ref=${ref.reference} status=${ref.status}`);
  if (ref.status !== "CONFIRMED") throw new Error("AUTO should confirm instantly");

  console.log("REVIEW booking (MLCC/chemotherapy) → expect REQUESTED");
  const r2 = await createAppointmentService({
    centreId: review.centreId,
    centreServiceId: review.id,
    date,
    time: "11:00",
    fullName: "Review Patient",
    phone: "08091111111",
  });
  console.log(`  ref=${r2.reference} status=${r2.status}`);
  if (r2.status !== "REQUESTED") throw new Error("REVIEW should land in REQUESTED");

  const notes = await prisma.notification.groupBy({ by: ["templateKey"], _count: true, where: { appointment: { reference: { in: [ref.reference, r2.reference] } } } });
  console.log("  queued notifications:", JSON.stringify(notes));
  const keys = notes.map((n) => n.templateKey);
  if (!keys.includes("BOOKING_CONFIRMED") || !keys.includes("BOOKING_RECEIVED")) {
    throw new Error("NOTIFICATION ACCEPTANCE FAILED");
  }

  // Cleanup
  const refs = [ref.reference, r2.reference];
  const appts = await prisma.appointment.findMany({ where: { reference: { in: refs } }, select: { id: true } });
  const ids = appts.map((a) => a.id);
  await prisma.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: ids } } });
  await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
  await prisma.patient.deleteMany({ where: { phone: { in: [...phones.map((p) => `+234${p.slice(1)}`), "+2348091111111"] } } });
  console.log("cleanup done — ALL PHASE 2 ACCEPTANCE CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

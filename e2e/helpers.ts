import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** E2E test phones — cleaned before and after the suite. */
export const E2E_PHONES = ["+2348045500001", "+2348045500002", "+2348045500003", "+2348045500004"];
export const E2E_RAW = ["08045500001", "08045500002", "08045500003", "08045500004"];

export async function cleanupE2E() {
  const patients = await prisma.patient.findMany({
    where: { phone: { in: E2E_PHONES } },
    select: { id: true },
  });
  const pids = patients.map((p) => p.id);
  if (pids.length === 0) return;
  const appts = await prisma.appointment.findMany({
    where: { patientId: { in: pids } },
    select: { id: true },
  });
  const aids = appts.map((a) => a.id);
  const series = await prisma.careSeries.findMany({
    where: { patientId: { in: pids } },
    select: { id: true },
  });
  const sids = series.map((s) => s.id);
  await prisma.notification.deleteMany({ where: { appointmentId: { in: aids } } });
  await prisma.resultNotice.deleteMany({ where: { appointmentId: { in: aids } } });
  await prisma.followUpReminder.deleteMany({ where: { patientId: { in: pids } } });
  await prisma.scheduleChange.deleteMany({
    where: { OR: [{ appointmentId: { in: aids } }, { careSeriesId: { in: sids } }] },
  });
  await prisma.auditLog.deleteMany({
    where: { OR: [{ entityType: "Appointment", entityId: { in: aids } }, { entityType: "CareSeries", entityId: { in: sids } }] },
  });
  await prisma.appointment.deleteMany({ where: { id: { in: aids } } });
  await prisma.careSeries.deleteMany({ where: { id: { in: sids } } });
  await prisma.otpChallenge.deleteMany({ where: { phone: { in: E2E_PHONES } } });
  await prisma.patient.deleteMany({ where: { id: { in: pids } } });
}

export async function disconnectE2E() {
  await prisma.$disconnect();
}

/** A weekday ~2 weeks out (YYYY-MM-DD), safely inside the booking window. */
export function futureWeekday(daysOut = 14): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOut);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

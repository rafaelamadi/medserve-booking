"use server";

import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

/** FR-F3: reminders on an appointment (staff view, scoped). */
export async function listFollowUpsForAppointment(appointmentId: string) {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  const a = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { centreId: true },
  });
  if (!a) throw new Error("Not found");
  if (s.role !== "SUPER_ADMIN" && !s.centreIds.includes(a.centreId)) {
    throw new Error("Forbidden: centre scope");
  }
  return prisma.followUpReminder.findMany({
    where: { appointmentId },
    orderBy: { dueOn: "asc" },
  });
}

"use server";

import { listCentreServices } from "@/entities/centre-service";
import { getStaffSession, requireRole } from "@/shared/lib/auth";
import { cancelFollowUpService, scheduleFollowUpService } from "./service";

/** Service options for the follow-up form (scoped, active only). */
export async function getFollowUpServices(
  centreId: string,
): Promise<{ ok: true; services: Array<{ id: string; name: string }> } | { ok: false; error: string }> {
  try {
    const items = await listCentreServices(centreId);
    return {
      ok: true,
      services: items.filter((x) => x.isActive).map((x) => ({ id: x.service.id, name: x.service.name })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

type ScheduleResult = { ok: true; id: string } | { ok: false; error: string };

async function staffActor() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  await requireRole("STAFF");
  return { staffId: s.staffId, role: s.role, centreIds: s.centreIds };
}

/** FR-F1/F3: schedule (or reschedule) a follow-up reminder. Sent exactly once. */
export async function scheduleFollowUpAction(input: unknown): Promise<ScheduleResult> {
  try {
    const staff = await staffActor();
    return scheduleFollowUpService(
      input as { centreId: string; serviceId: string; dueOn: string; appointmentId?: string; patientId?: string },
      staff,
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** FR-F3: cancel or edit (edit = cancel + schedule anew). */
export async function cancelFollowUpAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const staff = await staffActor();
    return cancelFollowUpService(id, staff);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

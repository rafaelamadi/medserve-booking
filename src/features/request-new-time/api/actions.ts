"use server";

import { getSessionPhone } from "@/shared/lib/patientCookie";
import { requestNewTimeService, type RequestNewTimeResult } from "./service";

/**
 * FR-M4: patient requests a new time (ordinary appointments only).
 * AUTO → confirmed immediately when free; REVIEW → RESCHEDULE_REQUESTED with
 * the original slot held. Capped by maxPatientReschedules (server-enforced).
 */
export async function requestNewTimeAction(
  reference: string,
  input: { date: string; time: string },
): Promise<RequestNewTimeResult> {
  const phone = await getSessionPhone();
  if (!phone) return { ok: false, error: "Sign in with your booking reference first" };
  return requestNewTimeService(reference, phone, input);
}

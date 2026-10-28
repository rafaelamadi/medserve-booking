"use server";

import { getSessionPhone } from "@/shared/lib/patientCookie";
import { cancelPatientBookingService } from "./service";

type Result = { ok: true } | { ok: false; error: string };

/** FR-M3: patient cancel until the cutoff (server-enforced). */
export async function cancelPatientBookingAction(reference: string): Promise<Result> {
  const phone = await getSessionPhone();
  if (!phone) return { ok: false, error: "Sign in with your booking reference first" };
  return cancelPatientBookingService(reference, phone);
}

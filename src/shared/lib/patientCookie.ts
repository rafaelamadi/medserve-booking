"use server";

import { cookies } from "next/headers";
import { PATIENT_COOKIE, sealPatientSession, unsealPatientSession, type PatientSession } from "./patientSession";

/** Phone bound to the current patient session, or null. */
export async function getSessionPhone(): Promise<string | null> {
  const token = (await cookies()).get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    return unsealPatientSession(token)?.phone ?? null;
  } catch {
    return null;
  }
}

/** Email bound to the current patient session, or null. */
export async function getSessionEmail(): Promise<string | null> {
  const token = (await cookies()).get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    return unsealPatientSession(token)?.email ?? null;
  } catch {
    return null;
  }
}

/** Full active patient session payload, or null. */
export async function getPatientSession(): Promise<PatientSession | null> {
  const token = (await cookies()).get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    return unsealPatientSession(token);
  } catch {
    return null;
  }
}

export async function setPatientSession(
  input: string | { phone?: string; email?: string; patientId?: string; name?: string },
): Promise<void> {
  try {
    const store = await cookies();
    store.set(PATIENT_COOKIE, sealPatientSession(input), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 3600,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[setPatientSession] Cookies API unavailable outside HTTP request scope.");
    } else {
      throw err;
    }
  }
}

export async function logoutPatient(): Promise<void> {
  (await cookies()).delete(PATIENT_COOKIE);
}


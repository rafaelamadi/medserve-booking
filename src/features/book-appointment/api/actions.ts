"use server";

import { headers } from "next/headers";
import { bookingSubmitSchema } from "@/entities/appointment";
import { getAvailableSlots } from "@/entities/availability";
import { getClientIp, rateLimit } from "@/shared/lib/rateLimit";
import { createAppointmentService, SlotTakenError } from "./createAppointmentService";

export type SubmitResult =
  | { ok: true; reference: string; status: "REQUESTED" | "CONFIRMED" }
  | { ok: false; error: string; code?: "SLOT_TAKEN" | "RATE_LIMITED" | "INVALID"; alternatives?: Array<{ start: string; date: string }> };

/**
 * FR-B1–B10: public booking submit.
 * Guards (rate limit, honeypot, fill-time) run before the transactional service.
 */
export async function submitBooking(input: unknown): Promise<SubmitResult> {
  // Production limits are strict; dev/test get headroom for E2E runs.
  const prod = process.env.NODE_ENV === "production";
  const ip = getClientIp(await headers());
  if (!rateLimit(`book:ip:${ip}`, prod ? 5 : 200, 60 * 60_000).ok) {
    return { ok: false, error: "Too many bookings from this device, try again later", code: "RATE_LIMITED" };
  }
  const parsed = bookingSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form", code: "INVALID" };
  }
  const data = parsed.data;
  if (!rateLimit(`book:phone:${data.phone}`, prod ? 3 : 100, 60 * 60_000).ok) {
    return { ok: false, error: "Too many bookings for this phone number", code: "RATE_LIMITED" };
  }
  // Bot challenge: form must have been open > 2s (FR-B10).
  if (Date.now() - data.startedAt < 2000) {
    return { ok: false, error: "Please take a moment to review the form", code: "INVALID" };
  }

  try {
    const created = await createAppointmentService({
      centreId: data.centreId,
      centreServiceId: data.centreServiceId,
      date: data.date,
      time: data.time,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || undefined,
      note: data.note || undefined,
      source: "WEB",
    });
    return { ok: true, reference: created.reference, status: created.status };
  } catch (e) {
    if (e instanceof SlotTakenError) {
      // FR-B7: inline error + fresh nearby slots, no form data loss (client keeps state).
      const fresh = await getAvailableSlots({
        centreServiceId: data.centreServiceId,
        date: data.date,
        preferredTime: data.time,
      });
      const alternatives =
        "alternatives" in fresh
          ? fresh.alternatives.slice(0, 4).map((s) => ({ start: s.start, date: data.date }))
          : [];
      return { ok: false, error: e.message, code: "SLOT_TAKEN", alternatives };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Booking failed", code: "INVALID" };
  }
}

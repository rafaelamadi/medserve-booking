import type { Prisma } from "@prisma/client";
import { getManagedBooking, transitionAppointment } from "@/entities/appointment";
import { enqueueNotification } from "@/entities/notification";

type Result = { ok: true } | { ok: false; error: string };

function notify(tx: Prisma.TransactionClient, n: { appointmentId: string; patientId: string; templateKey: string; channel: "SMS" | "EMAIL"; isChange: boolean }) {
  return enqueueNotification(tx, n);
}

/**
 * FR-M3 core (no session inside): patient cancel until the cutoff.
 * The action wrapper supplies the session phone; scripts/tests pass it explicitly.
 */
export async function cancelPatientBookingService(reference: string, phone: string): Promise<Result> {
  try {
    if (!phone) return { ok: false, error: "Sign in with your booking reference first" };
    const managed = await getManagedBooking(reference, phone);
    if (!managed.ok) return managed;
    if (!managed.booking.canCancel) {
      return { ok: false, error: managed.booking.cancelBlockedReason ?? "Cannot cancel online" };
    }
    await transitionAppointment({
      id: managed.booking.id,
      kind: "cancel",
      actorType: "PATIENT",
      reason: "Cancelled by patient",
      notify,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cancel failed" };
  }
}

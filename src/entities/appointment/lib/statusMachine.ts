import type { AppointmentStatus } from "@prisma/client";

/** PRD §6.1 appointment status machine (pure). */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN", "NO_SHOW", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["CONFIRMED", "RESCHEDULE_PROPOSED", "CANCELLED"],
  RESCHEDULE_PROPOSED: ["CONFIRMED", "CANCELLED"],
  CHECKED_IN: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition ${from} → ${to}`);
  }
}

"use client";

import { useStaffMutation } from "@/shared/lib/useStaffMutation";
import { cancelPatientBookingAction } from "./actions";

export function useCancelPatientBooking() {
  return useStaffMutation((reference: string) => cancelPatientBookingAction(reference), [
    ["managed-booking"],
  ]);
}

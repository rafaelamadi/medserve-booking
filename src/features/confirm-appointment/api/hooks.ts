"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { cancelAppointmentStaffAction, confirmAppointmentAction } from "./actions";

export function useConfirmAppointment() {
  return useStaffMutation((id: string) => confirmAppointmentAction(id), HUB_INVALIDATE_PREFIXES);
}

export function useCancelAppointmentStaff() {
  return useStaffMutation(
    (input: { id: string; reason: string }) => cancelAppointmentStaffAction(input.id, input.reason),
    HUB_INVALIDATE_PREFIXES,
  );
}

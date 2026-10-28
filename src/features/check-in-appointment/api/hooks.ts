"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { checkInAppointmentAction, completeAppointmentAction } from "./actions";

export function useCheckInAppointment() {
  return useStaffMutation((id: string) => checkInAppointmentAction(id), HUB_INVALIDATE_PREFIXES);
}

export function useCompleteAppointment() {
  return useStaffMutation((id: string) => completeAppointmentAction(id), HUB_INVALIDATE_PREFIXES);
}

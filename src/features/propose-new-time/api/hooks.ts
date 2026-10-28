"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { approveRescheduleAction, proposeNewTimeAction } from "./actions";

export function useProposeNewTime() {
  return useStaffMutation(
    (input: { id: string; date: string; time: string; reason?: string }) =>
      proposeNewTimeAction(input.id, { date: input.date, time: input.time, reason: input.reason }),
    HUB_INVALIDATE_PREFIXES,
  );
}

export function useApproveReschedule() {
  return useStaffMutation((id: string) => approveRescheduleAction(id), [
    ...HUB_INVALIDATE_PREFIXES,
    ["reschedules"],
  ]);
}

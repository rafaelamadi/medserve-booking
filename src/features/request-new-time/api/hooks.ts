"use client";

import { useStaffMutation } from "@/shared/lib/useStaffMutation";
import { requestNewTimeAction } from "./actions";

export function useRequestNewTime() {
  return useStaffMutation(
    (input: { reference: string; date: string; time: string }) =>
      requestNewTimeAction(input.reference, { date: input.date, time: input.time }),
    [["managed-booking"], ["slots"]],
  );
}

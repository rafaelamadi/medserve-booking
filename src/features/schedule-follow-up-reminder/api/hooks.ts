"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelFollowUpAction, scheduleFollowUpAction } from "./actions";

export function useScheduleFollowUp(appointmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { centreId: string; serviceId: string; dueOn: string }) =>
      scheduleFollowUpAction({ ...input, appointmentId }),
    onSuccess: (res) => {
      if (res.ok) void qc.invalidateQueries({ queryKey: ["followups", appointmentId] });
    },
  });
}

export function useCancelFollowUp(appointmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelFollowUpAction(id),
    onSuccess: (res) => {
      if (res.ok) void qc.invalidateQueries({ queryKey: ["followups", appointmentId] });
    },
  });
}

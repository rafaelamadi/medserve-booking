"use client";

import { useQuery } from "@tanstack/react-query";
import { listFollowUpsForAppointment } from "./queries";

export function useFollowUps(appointmentId: string) {
  return useQuery({
    queryKey: ["followups", appointmentId],
    queryFn: () => listFollowUpsForAppointment(appointmentId),
    staleTime: 30_000,
  });
}

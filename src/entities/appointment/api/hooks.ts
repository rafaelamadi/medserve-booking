"use client";

import { useQuery } from "@tanstack/react-query";
import { appointmentKeys } from "./keys";
import { getAppointmentDetail, getDashboardStats, listAppointments, listRescheduleRequests } from "./queries";
import { getManagedBooking } from "./patient";
import type { QueueFilters } from "./queries";

/**
 * Hub live data (TanStack Query): polling + focus refetch keep the queue,
 * dashboard and attention panel fresh across staff sessions.
 */
export function useAppointmentQueue(filters: QueueFilters) {
  return useQuery({
    queryKey: appointmentKeys.queue(filters),
    queryFn: () => listAppointments(filters, null),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useAppointmentDetail(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => getAppointmentDetail(id, null),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: appointmentKeys.dashboard,
    queryFn: () => getDashboardStats(null),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRescheduleQueue() {
  return useQuery({
    queryKey: appointmentKeys.reschedules,
    queryFn: () => listRescheduleRequests(null),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useManagedBooking(reference: string | null) {
  return useQuery({
    queryKey: ["managed-booking", reference],
    queryFn: () => getManagedBooking(reference as string),
    enabled: !!reference,
    staleTime: 15_000,
  });
}

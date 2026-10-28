"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api";
// NOTE: deep imports (not entity barrels) — client bundles must never pull
// server-only modules (Prisma) transitively. These targets are "use server"
// actions, which compile to RPC stubs on the client.
import { listPublicCentres } from "@/entities/centre/api/public";
import { listPublicCentreServices } from "@/entities/centre-service/api/public";
import { getBookingConfirmation, getPublicClosedDays, getPublicSlots } from "./lookups";

/**
 * Booking wizard queries. Server functions double as fetchers so no extra
 * HTTP layer is needed; React Query owns caching/deduping/refetch.
 */
export function usePublicCentres() {
  return useQuery({ queryKey: queryKeys.centres, queryFn: () => listPublicCentres() });
}

export function usePublicCentreServices(centreId: string | null) {
  return useQuery({
    queryKey: queryKeys.centreServices(centreId ?? ""),
    queryFn: () => listPublicCentreServices(centreId as string),
    enabled: !!centreId,
  });
}

export function usePublicSlots(centreServiceId: string | null, date: string | null) {
  return useQuery({
    queryKey: queryKeys.slots(centreServiceId ?? "", date ?? ""),
    queryFn: () => getPublicSlots(centreServiceId as string, date as string),
    enabled: !!centreServiceId && !!date,
    staleTime: 15_000,
  });
}

export function useClosedDays(centreServiceId: string | null, yearMonth: string | null) {
  return useQuery({
    queryKey: queryKeys.closedDays(centreServiceId ?? "", yearMonth ?? ""),
    queryFn: () => getPublicClosedDays(centreServiceId as string, yearMonth as string),
    enabled: !!centreServiceId && !!yearMonth,
    staleTime: 60_000,
  });
}

export function useBookingConfirmation(reference: string | null) {
  return useQuery({
    queryKey: ["booking", reference],
    queryFn: () => getBookingConfirmation(reference as string),
    enabled: !!reference,
  });
}

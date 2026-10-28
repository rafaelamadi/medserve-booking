"use client";

import { useQuery } from "@tanstack/react-query";
import { findPatientByPhone, getPatientDetail, listPatients } from "./lookup";

export function usePatientLookup(phone: string) {
  return useQuery({
    queryKey: ["patient", phone],
    queryFn: () => findPatientByPhone(phone),
    enabled: phone.replace(/\D/g, "").length >= 7,
    staleTime: 60_000,
  });
}

export function usePatients(search: string) {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: () => listPatients(search || undefined),
    staleTime: 30_000,
  });
}

export function usePatientDetail(id: string) {
  return useQuery({
    queryKey: ["patient", id, "detail"],
    queryFn: () => getPatientDetail(id),
    staleTime: 30_000,
  });
}

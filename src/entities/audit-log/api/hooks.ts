"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditFor } from "./queries";

export function useAuditTrail(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ["audit", entityType, entityId],
    queryFn: () => listAuditFor(entityType, entityId),
    staleTime: 30_000,
  });
}

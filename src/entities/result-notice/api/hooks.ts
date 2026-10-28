"use client";

import { useQuery } from "@tanstack/react-query";
import { listResultNotices } from "./queries";

export function useResultsBoard(collected: "pending" | "collected" | "all" = "pending") {
  return useQuery({
    queryKey: ["results", collected],
    queryFn: () => listResultNotices(collected),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

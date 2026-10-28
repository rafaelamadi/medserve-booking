"use client";

import { useQuery } from "@tanstack/react-query";
import { getAttentionItemsScoped } from "./attention";

export function useAttentionItems() {
  return useQuery({
    queryKey: ["attention"],
    queryFn: () => getAttentionItemsScoped(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { markResultCollectedAction } from "./actions";

export function useMarkResultCollected() {
  return useStaffMutation((id: string) => markResultCollectedAction(id), [
    ...HUB_INVALIDATE_PREFIXES,
    ["results"],
  ]);
}

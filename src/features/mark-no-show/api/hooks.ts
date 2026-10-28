"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { markNoShowAction } from "./actions";

export function useMarkNoShow() {
  return useStaffMutation((id: string) => markNoShowAction(id), HUB_INVALIDATE_PREFIXES);
}

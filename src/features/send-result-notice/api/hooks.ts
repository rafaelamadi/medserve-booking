"use client";

import { HUB_INVALIDATE_PREFIXES, useStaffMutation } from "@/shared/lib/useStaffMutation";
import { sendResultNoticeAction } from "./actions";

export function useSendResultNotice() {
  return useStaffMutation((id: string) => sendResultNoticeAction(id), [
    ...HUB_INVALIDATE_PREFIXES,
    ["results"],
  ]);
}

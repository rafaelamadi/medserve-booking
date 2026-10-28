"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ActionResult = { ok: boolean; error?: string };

/**
 * Shared mutation wrapper for hub staff actions: on success, refresh every
 * live hub query. Key lists come from the caller (shared must not import
 * entities — FSD import direction).
 */
export function useStaffMutation<TArg, TResult extends ActionResult = ActionResult>(
  fn: (arg: TArg) => Promise<TResult>,
  invalidateKeys: ReadonlyArray<readonly unknown[]>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      if (res.ok) {
        void Promise.all(invalidateKeys.map((key) => qc.invalidateQueries({ queryKey: key })));
      }
    },
  });
}

export const HUB_INVALIDATE_PREFIXES = [
  ["appointments"],
  ["appointment"],
  ["dashboard"],
  ["attention"],
] as const;

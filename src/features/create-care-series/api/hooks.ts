"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeriesAction } from "./actions";

export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSeriesAction,
    onSuccess: (res) => {
      if (res.ok) {
        void Promise.all([
          qc.invalidateQueries({ queryKey: ["series"] }),
          qc.invalidateQueries({ queryKey: ["series-preview"] }),
          qc.invalidateQueries({ queryKey: ["series-flagged"] }),
          qc.invalidateQueries({ queryKey: ["appointments"] }),
          qc.invalidateQueries({ queryKey: ["dashboard"] }),
        ]);
      }
    },
  });
}

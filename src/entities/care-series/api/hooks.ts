"use client";

import { useQuery } from "@tanstack/react-query";
import { seriesKeys } from "./keys";
import { previewSeries, type PreviewInput } from "./preview";
import { getCareSeriesDetail, listCareSeries, listFlaggedSessions } from "./seriesQueries";

export function useSeriesPreview(input: PreviewInput | null) {
  return useQuery({
    queryKey: seriesKeys.preview(input as PreviewInput),
    queryFn: () => previewSeries(input as PreviewInput),
    enabled: !!input,
    staleTime: 30_000,
  });
}

export function useCareSeriesList(status?: "ACTIVE" | "COMPLETED" | "CANCELLED") {
  return useQuery({
    queryKey: seriesKeys.list(status),
    queryFn: () => listCareSeries(status),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCareSeriesDetail(id: string) {
  return useQuery({
    queryKey: seriesKeys.detail(id),
    queryFn: () => getCareSeriesDetail(id),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useFlaggedSeries() {
  return useQuery({
    queryKey: seriesKeys.flagged,
    queryFn: () => listFlaggedSessions(null),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

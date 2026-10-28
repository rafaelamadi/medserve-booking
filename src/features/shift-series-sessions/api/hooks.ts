"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addSessionAction,
  cancelSeriesAction,
  cancelSessionAction,
  markSessionNoShowAction,
  shiftOneSessionAction,
  shiftRemainingAction,
} from "./actions";

function useInvalidateSeries() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["series"] }),
      qc.invalidateQueries({ queryKey: ["series-flagged"] }),
      qc.invalidateQueries({ queryKey: ["appointments"] }),
      qc.invalidateQueries({ queryKey: ["appointment"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
      qc.invalidateQueries({ queryKey: ["attention"] }),
    ]);
}

export function useShiftOneSession() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (input: { appointmentId: string; newDate: string; reason?: string }) =>
      shiftOneSessionAction(input.appointmentId, input.newDate, input.reason),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

export function useShiftRemaining() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (input: { seriesId: string; fromDate: string; deltaDays: number; reason?: string }) =>
      shiftRemainingAction(input.seriesId, input.fromDate, input.deltaDays, input.reason),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

export function useAddSession() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (input: { seriesId: string; date: string; reason?: string }) =>
      addSessionAction(input.seriesId, input.date, input.reason),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

export function useCancelSession() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (input: { appointmentId: string; reason?: string }) =>
      cancelSessionAction(input.appointmentId, input.reason),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

export function useCancelSeries() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (input: { seriesId: string; reason?: string }) =>
      cancelSeriesAction(input.seriesId, input.reason),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

export function useMarkSessionNoShow() {
  const invalidate = useInvalidateSeries();
  return useMutation({
    mutationFn: (appointmentId: string) => markSessionNoShowAction(appointmentId),
    onSuccess: (r) => { if (r.ok) void invalidate(); },
  });
}

"use server";

import { getStaffSession, requireRole } from "@/shared/lib/auth";
import { createSeriesService, SeriesConflictError, type CreateSeriesInput } from "./service";

type Result =
  | { ok: true; seriesId: string; count: number }
  | { ok: false; error: string; conflicts?: string[] };

/** FR-S1: clinician/manager-only series creation (STAFF blocked). */
export async function createSeriesAction(input: CreateSeriesInput): Promise<Result> {
  try {
    const s = await getStaffSession();
    if (!s) return { ok: false, error: "Unauthorized" };
    await requireRole("CLINICIAN");
    const r = await createSeriesService(input, {
      staffId: s.staffId,
      role: s.role,
      centreIds: s.centreIds,
    });
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof SeriesConflictError) {
      return { ok: false, error: e.message, conflicts: e.dates };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

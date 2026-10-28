"use server";

import { getStaffSession, requireRole } from "@/shared/lib/auth";
import {
  addSessionService,
  cancelSeriesService,
  cancelSessionService,
  markSessionNoShowService,
  shiftOneSessionService,
  shiftRemainingService,
} from "./service";

type Ok = { ok: true; count?: number };
type Result = Ok | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : "Failed" });

async function actor() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  await requireRole("CLINICIAN"); // STAFF and VIEWER blocked (FR-S role gate)
  return { staffId: s.staffId, role: s.role, centreIds: s.centreIds };
}

/** FR-S6 staff-only series operations. Each sends exactly one consolidated notice. */
export async function shiftOneSessionAction(appointmentId: string, newDate: string, reason?: string): Promise<Result> {
  try {
    await shiftOneSessionService(appointmentId, newDate, reason, await actor());
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function shiftRemainingAction(seriesId: string, fromDate: string, deltaDays: number, reason?: string): Promise<Result> {
  try {
    const r = await shiftRemainingService(seriesId, fromDate, deltaDays, reason, await actor());
    return { ok: true, count: r.count };
  } catch (e) {
    return fail(e);
  }
}

export async function addSessionAction(seriesId: string, date: string, reason?: string): Promise<Result> {
  try {
    await addSessionService(seriesId, date, reason, await actor());
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelSessionAction(appointmentId: string, reason?: string): Promise<Result> {
  try {
    await cancelSessionService(appointmentId, reason, await actor());
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelSeriesAction(seriesId: string, reason?: string): Promise<Result> {
  try {
    const r = await cancelSeriesService(seriesId, reason, await actor());
    return { ok: true, count: r.count };
  } catch (e) {
    return fail(e);
  }
}

export async function markSessionNoShowAction(appointmentId: string): Promise<Result> {
  try {
    await markSessionNoShowService(appointmentId, await actor());
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

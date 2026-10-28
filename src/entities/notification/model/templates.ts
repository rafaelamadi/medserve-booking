import { toCentreLocal } from "@/shared/lib/datetime";

/** Template version for every booking message (FR-N1: templates in code, versioned). */
export const BOOKING_TEMPLATE_VERSION = "booking-v1";

export type BookingMessageCtx = {
  reference: string;
  centreName: string;
  centrePhone: string;
  serviceName: string;
  startsAt: Date;
  centreTimezone: string;
  prepInstructions?: string | null;
  manageUrl: string;
};

/** FR-N4 / FR-R2: generic content only — never clinical details. */
export function bookingReceivedMessage(ctx: BookingMessageCtx): string {
  return (
    `MedServe: request ${ctx.reference} received for ${ctx.serviceName} at ${ctx.centreName}. ` +
    `The centre will confirm shortly. Centre line: ${ctx.centrePhone}.`
  );
}

export function bookingConfirmedMessage(ctx: BookingMessageCtx): string {
  const when = toCentreLocal(ctx.startsAt, ctx.centreTimezone);
  const prep = ctx.prepInstructions?.trim() ? ` Prepare: ${ctx.prepInstructions.trim()}` : "";
  return (
    `MedServe: booking ${ctx.reference} CONFIRMED — ${ctx.serviceName}, ${ctx.centreName}, ${when}.${prep} ` +
    `Manage: ${ctx.manageUrl} Centre line: ${ctx.centrePhone}.`
  );
}

/** BOOKING_CANCELLED — cancelled by either side, how to rebook. */
export function bookingCancelledMessage(
  ctx: BookingMessageCtx & { reason?: string | null; byStaff?: boolean },
): string {
  const reason = ctx.reason?.trim() ? ` Reason: ${ctx.reason.trim()}` : "";
  const who = ctx.byStaff ? "The centre has" : "You have";
  return (
    `MedServe: booking ${ctx.reference} (${ctx.serviceName}, ${ctx.centreName}) is cancelled. ` +
    `${who} cancelled it.${reason} To rebook, visit ${ctx.manageUrl} or call ${ctx.centrePhone}.`
  );
}

export type TimeChangeCtx = BookingMessageCtx & {
  oldStartsAt: Date;
  reason?: string | null;
};

/** BOOKING_TIME_UNAVAILABLE — centre adjusted the time; decision is final (D1). */
export function bookingTimeUnavailableMessage(ctx: TimeChangeCtx): string {
  const oldWhen = toCentreLocal(ctx.oldStartsAt, ctx.centreTimezone);
  const newWhen = toCentreLocal(ctx.startsAt, ctx.centreTimezone);
  const reason = ctx.reason?.trim() ? ` Reason: ${ctx.reason.trim()}` : "";
  return (
    `MedServe: booking ${ctx.reference} moved from ${oldWhen} to ${newWhen} (${ctx.centreName}).${reason} ` +
    `Questions? Call ${ctx.centrePhone}.`
  );
}

/** RESCHEDULE_CONFIRMED — patient-requested new time applied. */
export function rescheduleConfirmedMessage(ctx: BookingMessageCtx): string {
  const when = toCentreLocal(ctx.startsAt, ctx.centreTimezone);
  return `MedServe: booking ${ctx.reference} moved to ${when} (${ctx.centreName}). Centre line: ${ctx.centrePhone}.`;
}

/** RESCHEDULE_REQUEST_RECEIVED — REVIEW reschedule held original slot. */
export function rescheduleRequestReceivedMessage(ctx: BookingMessageCtx): string {
  return (
    `MedServe: new-time request for ${ctx.reference} received; your original slot is held. ` +
    `The centre will confirm. Centre line: ${ctx.centrePhone}.`
  );
}

/** REMINDER_24H / REMINDER_2H — generic, with prep instructions. */
export function appointmentReminderMessage(ctx: BookingMessageCtx): string {
  const when = toCentreLocal(ctx.startsAt, ctx.centreTimezone);
  const prep = ctx.prepInstructions?.trim() ? ` Prepare: ${ctx.prepInstructions.trim()}` : "";
  return (
    `MedServe reminder: ${ctx.reference} — ${ctx.serviceName}, ${ctx.centreName}, ${when}.${prep} ` +
    `Centre line: ${ctx.centrePhone}.`
  );
}

export type SeriesMessageCtx = BookingMessageCtx & {
  sessions: Array<{ date: string; time: string }>;
};

/** SERIES_CREATED — one notice with the full schedule (FR-S5). */
export function seriesCreatedMessage(ctx: SeriesMessageCtx): string {
  const list = ctx.sessions.map((s) => `${s.date} ${s.time}`).join("; ");
  return (
    `MedServe: your ${ctx.serviceName} schedule at ${ctx.centreName} is set (${ctx.sessions.length} sessions): ${list}. ` +
    `You will get a reminder before each session. Centre line: ${ctx.centrePhone}.`
  );
}

export type SeriesChangeCtx = BookingMessageCtx & {
  changes: Array<{ oldDate: string; newDate: string | null; note: string }>;
  reason?: string | null;
};

/** SERIES_CHANGED — one consolidated notice per save (FR-S7). */
export function seriesChangedMessage(ctx: SeriesChangeCtx): string {
  const list = ctx.changes.map((c) => (c.newDate ? `${c.oldDate}→${c.newDate}` : `${c.oldDate} ${c.note}`)).join("; ");
  const reason = ctx.reason?.trim() ? ` Reason: ${ctx.reason.trim()}` : "";
  return (
    `MedServe: your ${ctx.serviceName} schedule at ${ctx.centreName} changed: ${list}.${reason} ` +
    `Centre line: ${ctx.centrePhone}.`
  );
}

export type ResultMessageCtx = {
  reference: string;
  centreName: string;
  centrePhone: string;
  instruction: string;
};

/** RESULT_READY — strictly generic: no test name, no findings (FR-R2). */
export function resultReadyMessage(ctx: ResultMessageCtx): string {
  return (
    `MedServe: your result for visit ${ctx.reference} is ready at ${ctx.centreName}. ` +
    `${ctx.instruction} Centre line: ${ctx.centrePhone}.`
  );
}

/** RESULT_NUDGE — one gentle reminder (FR-R4). */
export function resultNudgeMessage(ctx: ResultMessageCtx): string {
  return (
    `MedServe: a friendly reminder — your result for visit ${ctx.reference} is still waiting at ${ctx.centreName}. ` +
    `${ctx.instruction} Centre line: ${ctx.centrePhone}.`
  );
}

export type FollowUpCtx = {
  centreName: string;
  centrePhone: string;
  bookingUrl: string;
};

/** FOLLOWUP_DUE — generic + prefilled booking link (FR-F2). */
export function followUpDueMessage(ctx: FollowUpCtx): string {
  return (
    `MedServe: a follow-up screening at ${ctx.centreName} is due. ` +
    `Book here: ${ctx.bookingUrl} Centre line: ${ctx.centrePhone}.`
  );
}

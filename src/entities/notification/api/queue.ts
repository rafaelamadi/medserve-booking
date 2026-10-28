import type { NotificationChannel, Prisma } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";
import { sendEmail, sendSms, sendWhatsApp } from "../lib/senders";
import {
  appointmentReminderMessage,
  bookingCancelledMessage,
  bookingConfirmedMessage,
  bookingReceivedMessage,
  bookingTimeUnavailableMessage,
  followUpDueMessage,
  rescheduleConfirmedMessage,
  rescheduleRequestReceivedMessage,
  resultNudgeMessage,
  resultReadyMessage,
  seriesChangedMessage,
  seriesCreatedMessage,
} from "../model/templates";
import { minutesToHHmm, toDateStrInZone, utcToLocalMinutes } from "@/shared/lib/dates";

type Tx = Prisma.TransactionClient;

export type EnqueueInput = {
  appointmentId?: string;
  patientId?: string;
  templateKey: string;
  channel: NotificationChannel;
  isChange?: boolean;
};

/** FR-N3: every send goes through the queue. Called inside state-change transactions. */
export async function enqueueNotification(tx: Tx, input: EnqueueInput) {
  return tx.notification.create({
    data: {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      templateKey: input.templateKey,
      channel: input.channel,
      isChange: input.isChange ?? false,
    },
  });
}

function appUrl(): string {
  return process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function renderMessage(
  templateKey: string,
  appointmentId?: string | null,
): Promise<{ to: string; text: string; email?: string | null }> {
  if (!appointmentId) throw new Error(`Template ${templateKey} needs an appointment`);
  const a = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      centre: true,
      centreService: { include: { service: true } },
      changes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!a) throw new Error("Appointment not found for notification");
  const ctx = {
    reference: a.reference,
    centreName: a.centre.name,
    centrePhone: a.centre.phone,
    serviceName: a.centreService.service.name,
    startsAt: a.startsAt,
    centreTimezone: a.centre.timezone,
    prepInstructions: a.centreService.service.prepInstructions,
    manageUrl: `${appUrl()}/manage?ref=${a.reference}`,
  };
  const last = a.changes[0];
  const patientPhoneOrTarget = a.patient.phone || a.patient.email || "";

  switch (templateKey) {
    case "BOOKING_CONFIRMED":
      return { to: patientPhoneOrTarget, text: bookingConfirmedMessage(ctx), email: a.patient.email };
    case "BOOKING_CANCELLED":
      return {
        to: patientPhoneOrTarget,
        text: bookingCancelledMessage({ ...ctx, reason: last?.reason, byStaff: !!last?.staffId }),
        email: a.patient.email,
      };
    case "BOOKING_TIME_UNAVAILABLE":
      return {
        to: patientPhoneOrTarget,
        text: bookingTimeUnavailableMessage({
          ...ctx,
          oldStartsAt: last?.oldStartsAt ?? a.requestedStartsAt,
          reason: last?.reason,
        }),
        email: a.patient.email,
      };
    case "RESCHEDULE_CONFIRMED":
      return { to: patientPhoneOrTarget, text: rescheduleConfirmedMessage(ctx), email: a.patient.email };
    case "RESCHEDULE_REQUEST_RECEIVED":
      return { to: patientPhoneOrTarget, text: rescheduleRequestReceivedMessage(ctx), email: a.patient.email };
    case "REMINDER_24H":
    case "REMINDER_2H":
    case "SERIES_SESSION_REMINDER":
      return { to: patientPhoneOrTarget, text: appointmentReminderMessage(ctx), email: a.patient.email };
    case "RESULT_READY":
    case "RESULT_NUDGE": {
      // FR-R2: strictly generic — reference, centre, collection instruction. Never clinical.
      const instruction =
        a.centreService.resultInstruction?.trim() ||
        "Collect at the front desk with your reference number";
      const text =
        templateKey === "RESULT_READY"
          ? resultReadyMessage({ reference: a.reference, centreName: a.centre.name, centrePhone: a.centre.phone, instruction })
          : resultNudgeMessage({ reference: a.reference, centreName: a.centre.name, centrePhone: a.centre.phone, instruction });
      return { to: patientPhoneOrTarget, text, email: a.patient.email };
    }
    case "FOLLOWUP_DUE": {
      const reminder = await prisma.followUpReminder.findFirst({
        where: { appointmentId: a.id },
        orderBy: { dueOn: "desc" },
      });
      let bookingUrl = `${appUrl()}/book`;
      if (reminder) {
        const [centre, service] = await Promise.all([
          prisma.centre.findUnique({ where: { id: reminder.centreId }, select: { code: true, name: true, phone: true } }),
          prisma.service.findUnique({ where: { id: reminder.serviceId }, select: { slug: true } }),
        ]);
        if (centre && service) bookingUrl = `${appUrl()}/book?centre=${centre.code}&service=${service.slug}`;
        return {
          to: patientPhoneOrTarget,
          text: followUpDueMessage({
            centreName: centre?.name ?? a.centre.name,
            centrePhone: centre?.phone ?? a.centre.phone,
            bookingUrl,
          }),
          email: a.patient.email,
        };
      }
      return {
        to: patientPhoneOrTarget,
        text: followUpDueMessage({ centreName: a.centre.name, centrePhone: a.centre.phone, bookingUrl }),
        email: a.patient.email,
      };
    }
    case "SERIES_CREATED": {
      const siblings = a.careSeriesId
        ? await prisma.appointment.findMany({
            where: { careSeriesId: a.careSeriesId, deletedAt: null },
            orderBy: { sequenceNo: "asc" },
          })
        : [a];
      return {
        to: patientPhoneOrTarget,
        text: seriesCreatedMessage({
          ...ctx,
          sessions: siblings.map((s) => ({
            date: toDateStrInZone(s.startsAt, a.centre.timezone),
            time: minutesToHHmm(utcToLocalMinutes(s.startsAt, a.centre.timezone)),
          })),
        }),
        email: a.patient.email,
      };
    }
    case "SERIES_CHANGED": {
      const seriesChange = a.careSeriesId
        ? await prisma.scheduleChange.findFirst({
            where: { careSeriesId: a.careSeriesId, initiatedBy: "STAFF" },
            orderBy: { createdAt: "desc" },
          })
        : null;
      const since = seriesChange ? new Date(seriesChange.createdAt.getTime() - 5_000) : new Date(0);
      const rows = a.careSeriesId
        ? await prisma.scheduleChange.findMany({
            where: { appointmentId: { in: (await seriesSessionIds(a.careSeriesId)) }, createdAt: { gte: since } },
            orderBy: { createdAt: "asc" },
          })
        : [];
      const changes = rows.map((r) => ({
        oldDate: r.oldStartsAt ? toDateStrInZone(r.oldStartsAt, a.centre.timezone) : "—",
        newDate: r.newStartsAt ? toDateStrInZone(r.newStartsAt, a.centre.timezone) : null,
        note: r.kind === "CANCEL" ? "cancelled" : r.kind === "ADD_SESSION" ? "added" : "moved",
      }));
      return {
        to: patientPhoneOrTarget,
        text: seriesChangedMessage({ ...ctx, changes, reason: seriesChange?.reason }),
        email: a.patient.email,
      };
    }
    default:
      return { to: patientPhoneOrTarget, text: bookingReceivedMessage(ctx), email: a.patient.email };
  }
}

async function seriesSessionIds(seriesId: string): Promise<string[]> {
  const rows = await prisma.appointment.findMany({
    where: { careSeriesId: seriesId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

const MAX_ATTEMPTS = 5;
const backoffMs = (attempts: number) => Math.pow(2, Math.min(attempts, 6)) * 60_000;

/** FR-N2 fallback chain for change notices: SMS → WhatsApp → email. */
function nextChannel(channel: NotificationChannel): NotificationChannel | null {
  if (channel === "SMS") return "WHATSAPP";
  if (channel === "WHATSAPP") return "EMAIL";
  return null;
}

async function sendOne(
  n: { id: string; templateKey: string; appointmentId: string | null; channel: NotificationChannel },
): Promise<string> {
  const msg = await renderMessage(n.templateKey, n.appointmentId);
  if (n.channel === "EMAIL") {
    if (!msg.email) throw new Error("No email on file");
    return (await sendEmail(msg.email, `MedServe booking ${n.templateKey}`)).providerRef;
  }
  if (n.channel === "WHATSAPP") {
    return (await sendWhatsApp(msg.to)).providerRef;
  }
  return (await sendSms(msg.to, msg.text)).providerRef;
}

/**
 * Queue worker with retry/backoff + channel fallback (FR-N2/N3).
 * Picks QUEUED rows and FAILED rows whose backoff has elapsed.
 */
export async function processQueue(limit = 20): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const pending = await prisma.notification.findMany({
    where: {
      OR: [
        { status: "QUEUED" },
        { status: "FAILED", nextAttemptAt: { lte: now }, attempts: { lt: MAX_ATTEMPTS } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  let sent = 0;
  let failed = 0;
  for (const n of pending) {
    try {
      const providerRef = await sendOne(n);
      await prisma.notification.update({
        where: { id: n.id },
        data: { status: "SENT", sentAt: new Date(), providerRef, attempts: { increment: 1 }, nextAttemptAt: null },
      });
      sent++;
    } catch (e) {
      const attempts = n.attempts + 1;
      const err = e instanceof Error ? e.message.slice(0, 500) : "send failed";
      if (n.isChange) {
        const fallback = nextChannel(n.channel);
        if (fallback) {
          // Fall through to the next channel; keep the failed row for the trail.
          // (EMAIL without an address fails at send time and surfaces in the hub.)
          await prisma.notification.update({
            where: { id: n.id },
            data: { status: "FAILED", lastError: err, attempts: { increment: 1 }, nextAttemptAt: null },
          });
          await prisma.notification.create({
            data: {
              appointmentId: n.appointmentId,
              patientId: n.patientId,
              templateKey: n.templateKey,
              channel: fallback,
              isChange: true,
            },
          });
          failed++;
          continue;
        }
      }
      const exhausted = attempts >= MAX_ATTEMPTS;
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          status: exhausted ? "FAILED" : "QUEUED",
          lastError: err,
          attempts: { increment: 1 },
          nextAttemptAt: exhausted ? null : new Date(Date.now() + backoffMs(attempts)),
        },
      });
      console.log(`[notify:failed] template=${n.templateKey} channel=${n.channel} attempts=${attempts}`);
      failed++;
    }
  }
  return { sent, failed };
}

/**
 * Reminder scheduler (24h + 2h before start). Called by the jobs route before
 * processQueue; idempotent via existing SENT rows.
 */
export async function enqueueDueReminders(now = new Date()): Promise<{ h24: number; h2: number; series: number }> {
  async function enqueueWindow(key: "REMINDER_24H" | "REMINDER_2H", fromMs: number, toMs: number) {
    const from = new Date(now.getTime() + fromMs);
    const to = new Date(now.getTime() + toMs);
    const due = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
        startsAt: { gte: from, lt: to },
        NOT: { notifications: { some: { templateKey: key, status: { in: ["QUEUED", "SENT", "DELIVERED"] } } } },
      },
      select: { id: true, patientId: true, patient: { select: { email: true } } },
    });
    for (const a of due) {
      await prisma.notification.create({
        data: { appointmentId: a.id, patientId: a.patientId, templateKey: key, channel: "SMS" },
      });
      if (a.patient.email) {
        await prisma.notification.create({
          data: { appointmentId: a.id, patientId: a.patientId, templateKey: key, channel: "EMAIL" },
        });
      }
    }
    return due.length;
  }
  const [h24, h2] = await Promise.all([
    enqueueWindow("REMINDER_24H", 23 * 3600_000, 25 * 3600_000),
    enqueueWindow("REMINDER_2H", 105 * 60_000, 135 * 60_000),
  ]);
  // FR-S5: one reminder before each series session (24h window, own template).
  const series = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      deletedAt: null,
      careSeriesId: { not: null },
      startsAt: { gte: new Date(now.getTime() + 23 * 3600_000), lt: new Date(now.getTime() + 25 * 3600_000) },
      NOT: { notifications: { some: { templateKey: "SERIES_SESSION_REMINDER", status: { in: ["QUEUED", "SENT", "DELIVERED"] } } } },
    },
    select: { id: true, patientId: true, patient: { select: { email: true } } },
  });
  for (const a of series) {
    await prisma.notification.create({
      data: { appointmentId: a.id, patientId: a.patientId, templateKey: "SERIES_SESSION_REMINDER", channel: "SMS" },
    });
    if (a.patient.email) {
      await prisma.notification.create({
        data: { appointmentId: a.id, patientId: a.patientId, templateKey: "SERIES_SESSION_REMINDER", channel: "EMAIL" },
      });
    }
  }
  return { h24, h2, series: series.length };
}

/**
 * FR-R4: one automatic nudge per uncollected result after the centre's
 * nudge delay (default 5 days). Idempotent via nudgedAt.
 */
export async function enqueueDueNudges(now = new Date()): Promise<{ nudged: number }> {
  const due = await prisma.resultNotice.findMany({
    where: { collectedAt: null, nudgedAt: null },
    include: {
      appointment: {
        select: {
          id: true,
          patientId: true,
          patient: { select: { email: true } },
          centre: { select: { resultNudgeDays: true } },
        },
      },
    },
  });
  let nudged = 0;
  for (const n of due) {
    const delayMs = (n.appointment.centre.resultNudgeDays ?? 5) * 24 * 3600_000;
    if (n.sentAt.getTime() + delayMs > now.getTime()) continue;
    await prisma.notification.create({
      data: { appointmentId: n.appointment.id, patientId: n.appointment.patientId, templateKey: "RESULT_NUDGE", channel: "SMS" },
    });
    if (n.appointment.patient.email) {
      await prisma.notification.create({
        data: { appointmentId: n.appointment.id, patientId: n.appointment.patientId, templateKey: "RESULT_NUDGE", channel: "EMAIL" },
      });
    }
    await prisma.resultNotice.update({ where: { id: n.id }, data: { nudgedAt: now } });
    nudged++;
  }
  return { nudged };
}

/**
 * FR-F2: fire due follow-up reminders (once each) with prefilled booking links.
 */
export async function enqueueDueFollowUps(now = new Date()): Promise<{ fired: number }> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const due = await prisma.followUpReminder.findMany({
    where: { status: "SCHEDULED", dueOn: { lte: today } },
    include: { patient: { select: { email: true } } },
  });
  for (const r of due) {
    await prisma.notification.create({
      data: { appointmentId: r.appointmentId, patientId: r.patientId, templateKey: "FOLLOWUP_DUE", channel: "SMS" },
    });
    if (r.patient.email) {
      await prisma.notification.create({
        data: { appointmentId: r.appointmentId, patientId: r.patientId, templateKey: "FOLLOWUP_DUE", channel: "EMAIL" },
      });
    }
    await prisma.followUpReminder.update({
      where: { id: r.id },
      data: { status: "SENT", sentAt: now },
    });
  }
  return { fired: due.length };
}

/** Hub "needs attention": failed change notices awaiting staff action (FR-N2). */
export async function getAttentionNotifications(centreIds: string[] | null) {
  return prisma.notification.findMany({
    where: {
      status: "FAILED",
      isChange: true,
      appointment: centreIds ? { centreId: { in: centreIds } } : undefined,
    },
    include: {
      appointment: { select: { reference: true, startsAt: true, centre: { select: { code: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

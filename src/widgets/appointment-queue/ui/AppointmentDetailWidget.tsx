"use client";

import { useEffect, useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useAppointmentDetail } from "@/entities/appointment/api/hooks";
import { useAuditTrail } from "@/entities/audit-log/api/hooks";
import { useCancelAppointmentStaff, useConfirmAppointment } from "@/features/confirm-appointment/api/hooks";
import { useProposeNewTime } from "@/features/propose-new-time/api/hooks";
import { useCheckInAppointment, useCompleteAppointment } from "@/features/check-in-appointment/api/hooks";
import { useMarkNoShow } from "@/features/mark-no-show/api/hooks";
import { useSendResultNotice } from "@/features/send-result-notice/api/hooks";
import { useCancelFollowUp, useScheduleFollowUp } from "@/features/schedule-follow-up-reminder/api/hooks";
import { useFollowUps } from "@/entities/follow-up-reminder/api/hooks";
import { getFollowUpServices } from "@/features/schedule-follow-up-reminder/api/actions";
import { toCentreLocal } from "@/shared/lib/datetime";
import { Button } from "@/shared/ui";

const inputCls = "h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm";

function FollowUpForm({ appointmentId, centreId, onDone, onError }: {
  appointmentId: string;
  centreId: string;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const schedule = useScheduleFollowUp(appointmentId);
  const [serviceId, setServiceId] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    void getFollowUpServices(centreId).then((r) => {
      if (r.ok) setServices(r.services);
    });
  }, [centreId]);
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        onError(null);
        const res = await schedule.mutateAsync({ centreId, serviceId, dueOn });
        if (!res.ok) onError(res.error ?? "Failed");
        else {
          setDueOn("");
          onDone();
        }
      }}
    >
      <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)} required aria-label="Service">
        <option value="">Service…</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input type="date" className={inputCls} value={dueOn} onChange={(e) => setDueOn(e.target.value)} required aria-label="Due date" />
      <Button size="sm" type="submit" disabled={schedule.isPending}>Schedule</Button>
    </form>
  );
}

export function AppointmentDetailWidget({ id, canAct }: { id: string; canAct: boolean }) {
  const detail = useAppointmentDetail(id);
  const audit = useAuditTrail("Appointment", id);
  const confirmM = useConfirmAppointment();
  const cancel = useCancelAppointmentStaff();
  const propose = useProposeNewTime();
  const checkin = useCheckInAppointment();
  const complete = useCompleteAppointment();
  const noshow = useMarkNoShow();
  const resultReady = useSendResultNotice();
  const cancelFu = useCancelFollowUp(id);
  const followUps = useFollowUps(id);

  const [showPropose, setShowPropose] = useState(false);
  const [pDate, setPDate] = useState("");
  const [pTime, setPTime] = useState("");
  const [pReason, setPReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cReason, setCReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (detail.isLoading) return <p className="text-sm text-zinc-500">Loading appointment…</p>;
  if (detail.error || !detail.data) return <p className="text-sm text-red-600">Appointment not found.</p>;
  const a = detail.data;
  const tz = a.centre.timezone;
  const busy = confirmM.isPending || cancel.isPending || propose.isPending || checkin.isPending || complete.isPending || noshow.isPending;

  async function run(promise: Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    const res = await promise;
    if (!res.ok) setActionError(res.error ?? "Action failed");
    else {
      setShowPropose(false);
      setShowCancel(false);
    }
  }

  const can = (fn: () => void, label: string) => (
    <Button key={label} size="sm" variant="outline" disabled={!canAct || busy} onClick={fn}>{label}</Button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-lg font-bold">{a.reference}</h1>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium">{a.status}</span>
        </div>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div><dt className="text-xs text-zinc-500">Patient</dt><dd className="font-medium">{a.patient.fullName} · {a.patient.phone}</dd></div>
          <div><dt className="text-xs text-zinc-500">When</dt><dd className="font-medium">{toCentreLocal(new Date(a.startsAt), tz)}</dd></div>
          <div><dt className="text-xs text-zinc-500">Centre · Service</dt><dd className="font-medium">{a.centre.code} · {a.centreService.service.name}</dd></div>
          <div><dt className="text-xs text-zinc-500">Source</dt><dd className="font-medium">{a.source}</dd></div>
          {a.patientNote && <div className="md:col-span-2"><dt className="text-xs text-zinc-500">Patient note</dt><dd>{a.patientNote}</dd></div>}
          {a.internalNote && <div className="md:col-span-2"><dt className="text-xs text-zinc-500">Internal note</dt><dd>{a.internalNote}</dd></div>}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {a.status === "REQUESTED" && (
            <>
              {can(() => run(confirmM.mutateAsync(a.id)), "Confirm")}
              {can(() => setShowPropose(true), "Propose new time")}
              {can(() => setShowCancel(true), "Cancel")}
            </>
          )}
          {a.status === "CONFIRMED" && (
            <>
              {can(() => run(checkin.mutateAsync(a.id)), "Check in")}
              {can(() => setShowPropose(true), "Propose new time")}
              {can(() => run(noshow.mutateAsync(a.id)), "No-show")}
              {can(() => setShowCancel(true), "Cancel")}
            </>
          )}
          {a.status === "RESCHEDULE_REQUESTED" && (
            <>
              {can(() => run(confirmM.mutateAsync(a.id)), "Approve time")}
              {can(() => setShowPropose(true), "Propose other")}
              {can(() => setShowCancel(true), "Cancel")}
            </>
          )}
          {a.status === "CHECKED_IN" && (
            <>
              {can(() => run(complete.mutateAsync(a.id)), "Complete")}
              {can(() => run(noshow.mutateAsync(a.id)), "No-show")}
            </>
          )}
          {!canAct && <span className="text-xs text-zinc-400">Read-only role.</span>}
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

        {showPropose && (
          <form
            className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(propose.mutateAsync({ id: a.id, date: pDate, time: pTime, reason: pReason || undefined }));
            }}
          >
            <input type="date" className={inputCls} value={pDate} onChange={(e) => setPDate(e.target.value)} required />
            <input type="time" className={inputCls} value={pTime} onChange={(e) => setPTime(e.target.value)} required />
            <input className={inputCls} placeholder="Reason (optional)" value={pReason} onChange={(e) => setPReason(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={busy}>Apply</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowPropose(false)}>Close</Button>
            </div>
          </form>
        )}
        {showCancel && (
          <form
            className="mt-3 flex gap-2 rounded-lg bg-zinc-50 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!cReason.trim()) return;
              if (!confirm("Cancel this appointment? The patient will be notified.")) return;
              void run(cancel.mutateAsync({ id: a.id, reason: cReason }));
            }}
          >
            <input className={`${inputCls} flex-1`} placeholder="Cancel reason (required)" value={cReason} onChange={(e) => setCReason(e.target.value)} required />
            <Button size="sm" type="submit" disabled={busy}>Cancel booking</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowCancel(false)}>Close</Button>
          </form>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Result notice</h2>
          {a.status !== "COMPLETED" ? (
            <p className="mt-1 text-xs text-zinc-400">Available once the visit is completed.</p>
          ) : a.resultNotice ? (
            <p className="mt-1 text-sm">
              Sent {new Date(a.resultNotice.sentAt).toLocaleDateString()}
              {a.resultNotice.nudgedAt ? ` · nudged ${new Date(a.resultNotice.nudgedAt).toLocaleDateString()}` : ""}
              {a.resultNotice.collectedAt ? ` · collected ${new Date(a.resultNotice.collectedAt).toLocaleDateString()}` : " · uncollected"}
            </p>
          ) : canAct ? (
            <Button size="sm" className="mt-2" disabled={resultReady.isPending} onClick={() => run(resultReady.mutateAsync(a.id))}>
              {resultReady.isPending ? "Sending…" : "Result ready"}
            </Button>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">Read-only role.</p>
          )}
          <p className="mt-1 text-[11px] text-zinc-400">Generic notice only — no results are stored or sent.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Follow-up reminders</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(followUps.data ?? []).map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-xs">
                <span>{f.dueOn ? new Date(f.dueOn).toLocaleDateString() : ""} · {f.status}</span>
                {f.status === "SCHEDULED" && canAct && (
                  <button className="underline" onClick={() => run(cancelFu.mutateAsync(f.id))}>Cancel</button>
                )}
              </li>
            ))}
            {(followUps.data ?? []).length === 0 && <li className="text-xs text-zinc-400">None scheduled.</li>}
          </ul>
          {canAct && <FollowUpForm appointmentId={a.id} centreId={a.centreId} onDone={() => setActionError(null)} onError={setActionError} />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">History</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {a.changes.map((c) => (
              <li key={c.id} className="border-l-2 border-zinc-200 pl-2">
                <p className="font-medium">{c.kind} · {c.initiatedBy}{c.staff ? ` · ${c.staff.name}` : ""}</p>
                <p className="text-xs text-zinc-500">
                  {c.oldStartsAt ? toCentreLocal(new Date(c.oldStartsAt), tz) : ""} → {c.newStartsAt ? toCentreLocal(new Date(c.newStartsAt), tz) : "—"}
                  {c.reason ? ` · ${c.reason}` : ""}
                </p>
              </li>
            ))}
            {a.changes.length === 0 && <li className="text-xs text-zinc-400">No changes yet.</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {a.notifications.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                <span className="font-mono text-xs">{n.templateKey}</span>
                <span className="text-xs text-zinc-500">{n.channel} · {n.status}{n.attempts > 1 ? ` · ${n.attempts} tries` : ""}</span>
              </li>
            ))}
            {a.notifications.length === 0 && <li className="text-xs text-zinc-400">None queued.</li>}
          </ul>
          <h2 className="mt-4 text-sm font-semibold">Audit</h2>
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {(audit.data ?? []).map((e) => (
              <li key={e.id}>{e.action} · {e.actorType}{e.staff ? ` · ${e.staff.name}` : ""} · {new Date(e.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

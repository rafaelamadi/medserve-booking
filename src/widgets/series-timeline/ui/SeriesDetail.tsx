"use client";

import { useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useCareSeriesDetail } from "@/entities/care-series/api/hooks";
import {
  useAddSession,
  useCancelSeries,
  useCancelSession,
  useMarkSessionNoShow,
  useShiftOneSession,
  useShiftRemaining,
} from "@/features/shift-series-sessions/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";
import { Button } from "@/shared/ui";

const inputCls = "h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs";
const badge: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-100 text-zinc-500",
  NO_SHOW: "bg-red-100 text-red-800",
  COMPLETED: "bg-zinc-200 text-zinc-700",
};

export function SeriesDetail({ id, canManage }: { id: string; canManage: boolean }) {
  const q = useCareSeriesDetail(id);
  const shiftOne = useShiftOneSession();
  const shiftAll = useShiftRemaining();
  const add = useAddSession();
  const cancelSess = useCancelSession();
  const cancelSeries = useCancelSeries();
  const noshow = useMarkSessionNoShow();

  const [shiftDate, setShiftDate] = useState<Record<string, string>>({});
  const [fromDate, setFromDate] = useState("");
  const [delta, setDelta] = useState(7);
  const [addDate, setAddDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading series…</p>;
  if (q.error || !q.data) return <p className="text-sm text-red-600">Series not found.</p>;
  const s = q.data;
  const tz = s.centreService.centre.timezone;

  async function run(p: Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    const r = await p;
    if (!r.ok) setError(r.error ?? "Action failed");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base font-semibold">{s.patient.fullName}</h1>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{s.status}</span>
          <span className="text-xs text-zinc-500">
            {s.centreService.centre.code} · {s.centreService.service.name} · {s.pattern}
            {s.createdBy ? ` · by ${s.createdBy.name}` : ""}
          </span>
        </div>
        {!canManage && <p className="mt-1 text-xs text-zinc-400">Read-only role — only clinicians and managers change series.</p>}
        {error && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">When</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Flags</th><th className="px-3 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {s.appointments.map((a) => (
              <tr key={a.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{a.sequenceNo}</td>
                <td className="px-3 py-2 whitespace-nowrap">{toCentreLocal(new Date(a.startsAt), tz)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${badge[a.status] ?? "bg-zinc-100"}`}>{a.status}</span>
                </td>
                <td className="px-3 py-2">
                  {a.needsAttention && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-800">needs attention</span>}
                </td>
                <td className="px-3 py-2">
                  {canManage && (a.status === "CONFIRMED" || a.status === "REQUESTED") && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input type="date" className={inputCls} value={shiftDate[a.id] ?? ""} onChange={(e) => setShiftDate((p) => ({ ...p, [a.id]: e.target.value }))} />
                      <Button size="sm" variant="outline" onClick={() => shiftDate[a.id] && run(shiftOne.mutateAsync({ appointmentId: a.id, newDate: shiftDate[a.id], reason: reason || undefined }))}>Shift</Button>
                      <Button size="sm" variant="outline" onClick={() => run(noshow.mutateAsync(a.id))}>No-show</Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Cancel this session? The patient will be notified.")) run(cancelSess.mutateAsync({ appointmentId: a.id, reason: reason || undefined })); }}>Cancel</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && s.status === "ACTIVE" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Shift all remaining</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="date" className={inputCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
              <input type="number" className={inputCls} value={delta} onChange={(e) => setDelta(Number(e.target.value))} aria-label="Days" />
              <input className={`${inputCls} col-span-2`} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button size="sm" className="col-span-2" disabled={!fromDate || !delta} onClick={() => run(shiftAll.mutateAsync({ seriesId: s.id, fromDate, deltaDays: delta, reason: reason || undefined }))}>
                Shift (one notice)
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Add session</h2>
            <div className="mt-2 flex gap-2">
              <input type="date" className={inputCls} value={addDate} onChange={(e) => setAddDate(e.target.value)} />
              <Button size="sm" disabled={!addDate} onClick={() => run(add.mutateAsync({ seriesId: s.id, date: addDate }))}>Add</Button>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Cancel series</h2>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { if (window.confirm(`Cancel all remaining sessions? The patient gets one notice.`)) run(cancelSeries.mutateAsync({ seriesId: s.id, reason: reason || undefined })); }}>
              Cancel series
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Series changes</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {s.changes.map((c) => (
            <li key={c.id} className="text-xs text-zinc-600">
              {c.kind} · {c.initiatedBy}{c.staff ? ` · ${c.staff.name}` : ""}{c.reason ? ` · ${c.reason}` : ""} · {new Date(c.createdAt).toLocaleString()}
            </li>
          ))}
          {s.changes.length === 0 && <li className="text-xs text-zinc-400">No changes yet.</li>}
        </ul>
      </div>
    </div>
  );
}

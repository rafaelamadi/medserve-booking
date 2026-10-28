"use client";

import Link from "next/link";
import { useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useRescheduleQueue } from "@/entities/appointment/api/hooks";
import { useApproveReschedule, useProposeNewTime } from "@/features/propose-new-time/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";
import { Button } from "@/shared/ui";

const inputCls = "h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs";

export function RescheduleQueue() {
  const q = useRescheduleQueue();
  const approve = useApproveReschedule();
  const propose = useProposeNewTime();
  const [forms, setForms] = useState<Record<string, { date: string; time: string; reason: string }>>({});
  const [error, setError] = useState<string | null>(null);

  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading reschedule requests…</p>;
  if (q.error) return <p className="text-sm text-red-600">Queue failed to load.</p>;

  async function doApprove(id: string) {
    setError(null);
    const res = await approve.mutateAsync(id);
    if (!res.ok) setError(res.error ?? "Approve failed");
  }

  async function doPropose(id: string) {
    const f = forms[id];
    if (!f?.date || !f?.time) {
      setError("Pick a date and time to propose");
      return;
    }
    setError(null);
    const res = await propose.mutateAsync({ id, date: f.date, time: f.time, reason: f.reason || undefined });
    if (!res.ok) setError(res.error ?? "Propose failed");
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Requested</th><th className="px-3 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((a) => {
              const req = a.changes[0]?.newStartsAt;
              const f = forms[a.id] ?? { date: "", time: "", reason: "" };
              const set = (k: string, v: string) => setForms((p) => ({ ...p, [a.id]: { ...f, [k]: v } }));
              return (
                <tr key={a.id} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/hub/appointments/${a.id}`} className="underline">{a.reference}</Link>
                    <br /><span className="text-zinc-500">{a.centre.code} · {a.centreService.service.name}</span>
                  </td>
                  <td className="px-3 py-2">{a.patient.fullName}<br /><span className="text-xs text-zinc-500">{a.patient.phone}</span></td>
                  <td className="px-3 py-2 whitespace-nowrap">{toCentreLocal(new Date(a.startsAt), a.centre.timezone)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {req ? toCentreLocal(new Date(req), a.centre.timezone) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button size="sm" disabled={approve.isPending} onClick={() => doApprove(a.id)}>Approve</Button>
                      <input type="date" className={inputCls} value={f.date} onChange={(e) => set("date", e.target.value)} />
                      <input type="time" className={inputCls} value={f.time} onChange={(e) => set("time", e.target.value)} />
                      <input className={inputCls} placeholder="Reason" value={f.reason} onChange={(e) => set("reason", e.target.value)} />
                      <Button size="sm" variant="outline" disabled={propose.isPending} onClick={() => doPropose(a.id)}>Propose other</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(q.data ?? []).length === 0 && (
              <tr className="border-t border-zinc-100"><td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-500">No pending requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-zinc-400">Auto-refreshes every 30s.</p>
    </div>
  );
}

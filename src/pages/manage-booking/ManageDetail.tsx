"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useManagedBooking } from "@/entities/appointment/api/hooks";
import { usePublicSlots } from "@/features/book-appointment/api/hooks";
import { useCancelPatientBooking } from "@/features/cancel-appointment/api/hooks";
import { useRequestNewTime } from "@/features/request-new-time/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";
import { logoutPatient } from "@/shared/lib/patientCookie";
import { Button } from "@/shared/ui";

const inputCls = "h-11 w-full rounded-md border border-zinc-300 px-3 text-base";

export function ManageDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const q = useManagedBooking(reference);
  const cancel = useCancelPatientBooking();
  const change = useRequestNewTime();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alts, setAlts] = useState<Array<{ start: string; date: string }>>([]);

  const b = q.data?.ok ? q.data.booking : null;
  const slotsQ = usePublicSlots(b ? b.centreServiceId : null, date || null);

  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading booking…</p>;
  if (!b) {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <p className="text-sm text-red-600">{(q.data && !q.data.ok && q.data.error) || "Booking not found."}</p>
        <Link href="/manage" className="mt-3 inline-block text-sm underline">Find your booking</Link>
      </div>
    );
  }

  async function doCancel() {
    if (!window.confirm("Cancel this booking?")) return;
    setError(null);
    const res = await cancel.mutateAsync(reference);
    if (!res.ok) setError(res.error ?? "Cancel failed");
  }

  async function doChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAlts([]);
    const res = await change.mutateAsync({ reference, date, time });
    if (!res.ok) {
      setError(res.error ?? "Change failed");
      if ("alternatives" in res && res.alternatives) setAlts(res.alternatives);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-lg font-bold">{b.reference}</h1>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium">{b.status}</span>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-zinc-500">Service</dt><dd className="font-medium">{b.serviceName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-zinc-500">Centre</dt><dd className="font-medium">{b.centreName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-zinc-500">When</dt><dd className="font-medium">{toCentreLocal(new Date(b.startsAt), b.centreTimezone)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-zinc-500">Centre line</dt><dd className="font-medium">{b.centrePhone}</dd></div>
        </dl>
        {b.prepInstructions && (
          <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm"><span className="font-semibold">How to prepare: </span>{b.prepInstructions}</p>
        )}
        {b.status === "RESCHEDULE_REQUESTED" && (
          <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            New-time request received{b.pendingRequest ? ` for ${toCentreLocal(new Date(b.pendingRequest), b.centreTimezone)}` : ""}; your original slot is held until the centre decides.
          </p>
        )}
        {b.isSeries && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This visit is part of a care series managed by the hospital. To change anything, call {b.centrePhone}.
          </p>
        )}
      </div>

      {!b.terminal && !b.isSeries && (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Request a new time ({b.reschedulesLeft} left)</h2>
            {b.canReschedule ? (
              <form onSubmit={doChange} className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputCls} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required />
                  <div className="text-xs text-zinc-500 self-center">
                    {b.confirmationMode === "REVIEW" ? "Centre confirms; original slot held." : "Instant confirmation when free."}
                  </div>
                </div>
                {date && (
                  <div className="grid grid-cols-3 gap-2">
                    {(slotsQ.data?.slots ?? []).map((s) => (
                      <button key={s.start} type="button" onClick={() => setTime(s.start)}
                        className={`rounded-lg border py-2 text-sm font-medium ${time === s.start ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200"}`}>
                        {s.start}
                      </button>
                    ))}
                    {(slotsQ.data?.slots ?? []).length === 0 && !slotsQ.isLoading && (
                      <p className="col-span-3 text-sm text-zinc-500">No open times — try another day.</p>
                    )}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                    {alts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {alts.map((a) => (
                          <button key={a.start} type="button" className="rounded border border-red-300 bg-white px-2 py-1 text-xs"
                            onClick={() => { setTime(a.start); setError(null); setAlts([]); }}>
                            Take {a.start}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={change.isPending || !date || !time}>
                  {change.isPending ? "Sending…" : "Request new time"}
                </Button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-amber-700">{b.rescheduleBlockedReason}</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Cancel booking</h2>
            {b.canCancel ? (
              <>
                <Button variant="outline" className="mt-3 w-full" disabled={cancel.isPending} onClick={doCancel}>
                  {cancel.isPending ? "Cancelling…" : "Cancel this booking"}
                </Button>
                {error && !date && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </>
            ) : (
              <p className="mt-2 text-sm text-amber-700">{b.cancelBlockedReason}</p>
            )}
          </div>
        </>
      )}

      <button
        className="w-full text-center text-sm text-zinc-500 underline"
        onClick={async () => {
          await logoutPatient();
          router.push("/manage");
        }}
      >
        Sign out of this booking
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useResultsBoard } from "@/entities/result-notice/api/hooks";
import { useMarkResultCollected } from "@/features/mark-result-collected/api/hooks";
import { Button } from "@/shared/ui";

export function ResultsBoard() {
  const [tab, setTab] = useState<"pending" | "collected" | "all">("pending");
  const q = useResultsBoard(tab);
  const collect = useMarkResultCollected();
  const [error, setError] = useState<string | null>(null);

  async function doCollect(id: string) {
    setError(null);
    const res = await collect.mutateAsync(id);
    if (!res.ok) setError(res.error ?? "Failed");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["pending", "collected", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white"}`}
          >
            {t === "pending" ? "Uncollected" : t === "collected" ? "Collected" : "All"}
          </button>
        ))}
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {q.isLoading && <p className="text-sm text-zinc-500">Loading results…</p>}
      {q.data && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Centre · Service</th><th className="px-3 py-2">Sent</th><th className="px-3 py-2">Nudged</th><th className="px-3 py-2">Collected</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody>
              {q.data.map((n) => (
                <tr key={n.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-mono text-xs">{n.appointment.reference}</td>
                  <td className="px-3 py-2">{n.appointment.patient.fullName}<br /><span className="text-xs text-zinc-500">{n.appointment.patient.phone}</span></td>
                  <td className="px-3 py-2">{n.appointment.centre.code} · {n.appointment.centreService.service.name}</td>
                  <td className="px-3 py-2 text-xs">{new Date(n.sentAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs">{n.nudgedAt ? new Date(n.nudgedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-xs">{n.collectedAt ? new Date(n.collectedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {!n.collectedAt ? (
                      <Button size="sm" variant="outline" disabled={collect.isPending} onClick={() => doCollect(n.id)}>Collected</Button>
                    ) : (
                      <Link href={`/hub/appointments/${n.appointmentId}`} className="text-xs underline">Open</Link>
                    )}
                  </td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr className="border-t border-zinc-100"><td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-500">Nothing here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-zinc-400">Auto-refreshes every 30s. One nudge goes out automatically after the centre’s delay.</p>
    </div>
  );
}

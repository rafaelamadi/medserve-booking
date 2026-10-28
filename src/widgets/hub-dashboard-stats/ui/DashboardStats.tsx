"use client";

import Link from "next/link";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useDashboardStats } from "@/entities/appointment/api/hooks";
import { useFlaggedSeries } from "@/entities/care-series/api/hooks";
import { useAttentionItems } from "@/entities/notification/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function DashboardStats() {
  const stats = useDashboardStats();
  const attention = useAttentionItems();
  const flagged = useFlaggedSeries();

  if (stats.isLoading) return <p className="text-sm text-zinc-500">Loading dashboard…</p>;
  if (stats.error || !stats.data) return <p className="text-sm text-red-600">Dashboard failed to load.</p>;
  const d = stats.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card label="Today" value={d.today} />
        <Card label="Pending confirmation" value={d.pendingConfirm} />
        <Card label="Reschedule requests" value={d.pendingReschedule} />
        <Card label="Failed notices" value={d.failed} />
        <Card label="No-show 30d" value={`${d.noShowRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Needs attention ({attention.data?.length ?? 0})</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(attention.data ?? []).map((n) => (
              <li key={n.id} className="rounded border border-red-200 bg-red-50 p-2">
                <Link href={n.appointment ? `/hub/appointments/${n.appointmentId}` : "#"} className="font-mono text-xs underline">
                  {n.appointment?.reference ?? n.templateKey}
                </Link>
                <p className="text-xs text-zinc-600">
                  {n.templateKey} · {n.channel} · {n.appointment?.centre.code} · {n.lastError?.slice(0, 80)}
                </p>
              </li>
            ))}
            {(attention.data ?? []).length === 0 && (flagged.data ?? []).length === 0 && (
              <li className="text-xs text-zinc-400">All clear.</li>
            )}
            {(flagged.data ?? []).map((f) => (
              <li key={f.id} className="rounded border border-amber-200 bg-amber-50 p-2">
                <Link href={`/hub/series/${f.careSeriesId}`} className="text-xs font-medium underline">
                  Series session · {f.patient.fullName}
                </Link>
                <p className="text-xs text-zinc-600">
                  {f.centre.code} · {toCentreLocal(new Date(f.startsAt), f.centre.timezone)} · needs attention
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Utilisation · last 7 days</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {d.utilisation.map((u) => (
              <li key={u.service} className="flex justify-between gap-2">
                <span className="truncate">{u.service}</span>
                <span className="font-medium">{u.count}</span>
              </li>
            ))}
            {d.utilisation.length === 0 && <li className="text-xs text-zinc-400">No visits yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

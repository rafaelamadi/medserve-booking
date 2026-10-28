"use client";

import Link from "next/link";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useCareSeriesList } from "@/entities/care-series/api/hooks";

export function SeriesList({ status }: { status?: "ACTIVE" | "COMPLETED" | "CANCELLED" }) {
  const q = useCareSeriesList(status);
  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading series…</p>;
  if (q.error) return <p className="text-sm text-red-600">Series failed to load.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
          <tr><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Centre · Service</th><th className="px-3 py-2">Sessions</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Flags</th></tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((s) => (
            <tr key={s.id} className="border-t border-zinc-100 hover:bg-zinc-50">
              <td className="px-3 py-2">
                <Link href={`/hub/series/${s.id}`} className="font-medium underline">{s.patient.fullName}</Link>
                <br /><span className="text-xs text-zinc-500">{s.patient.phone}</span>
              </td>
              <td className="px-3 py-2">{s.centreService.centre.code} · {s.centreService.service.name}</td>
              <td className="px-3 py-2">{s._count.appointments} / {s.totalSessions}</td>
              <td className="px-3 py-2">{s.status}</td>
              <td className="px-3 py-2">
                {s.needsAttention && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-800">needs attention</span>}
              </td>
            </tr>
          ))}
          {(q.data ?? []).length === 0 && (
            <tr className="border-t border-zinc-100"><td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-500">No series.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

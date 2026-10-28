"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { getReport, type ReportFilters } from "@/entities/appointment/api/reports";
import { usePublicCentreServices } from "@/features/book-appointment/api/hooks";
import { Button } from "@/shared/ui";

const inputCls = "h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm";
const STATUSES = ["ALL", "REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN", "COMPLETED", "NO_SHOW", "CANCELLED"];

export function ReportsBoard({ centres }: { centres: Array<{ id: string; code: string }> }) {
  const [centreId, setCentreId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const servicesQ = usePublicCentreServices(centreId || null);
  const filters: ReportFilters = {
    centreId: centreId || undefined,
    serviceId: serviceId || undefined,
    status,
    from: from || undefined,
    to: to || undefined,
  };
  const q = useQuery({
    queryKey: ["report", filters],
    queryFn: () => getReport(filters, null),
    staleTime: 30_000,
  });

  function downloadCsv() {
    const params = new URLSearchParams();
    if (centreId) params.set("centreId", centreId);
    if (serviceId) params.set("serviceId", serviceId);
    if (status !== "ALL") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.open(`/api/reports?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <select className={inputCls} value={centreId} onChange={(e) => { setCentreId(e.target.value); setServiceId(""); }} aria-label="Centre">
          <option value="">All centres</option>
          {centres.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>
        <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!centreId} aria-label="Service">
          <option value="">All services</option>
          {(servicesQ.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.service.name}</option>
          ))}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <Button size="sm" variant="outline" onClick={downloadCsv}>Export CSV</Button>
      </div>

      {q.isLoading && <p className="text-sm text-zinc-500">Loading report…</p>}
      {q.data && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold">Total {q.data.total}</span>
            {q.data.byStatus.map((b) => (
              <span key={b.status} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs">{b.status} · {b.count}</span>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold">By service</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {q.data.byService.map((b) => (
                  <li key={b.service} className="flex justify-between gap-2">
                    <span className="truncate">{b.service}</span><span className="font-medium">{b.count}</span>
                  </li>
                ))}
                {q.data.byService.length === 0 && <li className="text-xs text-zinc-400">No data.</li>}
              </ul>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 text-left text-zinc-500">
                  <tr><th className="px-2 py-2">Ref</th><th className="px-2 py-2">When</th><th className="px-2 py-2">Patient</th><th className="px-2 py-2">Status</th></tr>
                </thead>
                <tbody>
                  {q.data.rows.slice(0, 50).map((r) => (
                    <tr key={r.reference} className="border-t border-zinc-100">
                      <td className="px-2 py-1.5 font-mono">{r.reference}</td>
                      <td className="px-2 py-1.5">{new Date(r.startsAt).toLocaleString()}</td>
                      <td className="px-2 py-1.5">{r.patient}</td>
                      <td className="px-2 py-1.5">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {q.data.total > 50 && <p className="p-2 text-[11px] text-zinc-400">Showing 50 of {q.data.total} — export CSV for the full set (capped at 1000).</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

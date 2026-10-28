"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useAppointmentQueue } from "@/entities/appointment/api/hooks";
import type { QueueFilters } from "@/entities/appointment/api/queries";
import { usePublicCentreServices } from "@/features/book-appointment/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";

const inputCls = "h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm";

const STATUS_OPTIONS = ["ALL", "REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULE_PROPOSED", "CHECKED_IN", "COMPLETED", "NO_SHOW", "CANCELLED"] as const;

const badge: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  RESCHEDULE_REQUESTED: "bg-blue-100 text-blue-800",
  RESCHEDULE_PROPOSED: "bg-purple-100 text-purple-800",
  CHECKED_IN: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-zinc-200 text-zinc-700",
  NO_SHOW: "bg-red-100 text-red-800",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

export function AppointmentQueue({ centres }: { centres: Array<{ id: string; code: string }> }) {
  const [centreId, setCentreId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const servicesQ = usePublicCentreServices(centreId || null);
  const filters: QueueFilters = {
    centreId: centreId || undefined,
    serviceId: serviceId || undefined,
    status,
    from: from || undefined,
    to: to || undefined,
    search: debounced || undefined,
  };
  const q = useAppointmentQueue(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <select className={inputCls} value={centreId} onChange={(e) => { setCentreId(e.target.value); setServiceId(""); }}>
          <option value="">All centres</option>
          {centres.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>
        <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!centreId}>
          <option value="">All services</option>
          {(servicesQ.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.service.name}</option>
          ))}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <input
          className={`${inputCls} min-w-52 flex-1`}
          placeholder="Search ref, name, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {q.isLoading && <p className="text-sm text-zinc-500">Loading queue…</p>}
      {q.error && <p className="text-sm text-red-600">Queue failed to load.</p>}
      {q.data && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Centre · Service</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody>
              {q.data.map((a) => (
                <tr key={a.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-2 whitespace-nowrap">{toCentreLocal(new Date(a.startsAt), a.centre.timezone)}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/hub/appointments/${a.id}`} className="underline">{a.reference}</Link>
                  </td>
                  <td className="px-3 py-2">{a.patient.fullName}<br /><span className="text-xs text-zinc-500">{a.patient.phone}</span></td>
                  <td className="px-3 py-2">{a.centre.code} · {a.centreService.service.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${badge[a.status] ?? "bg-zinc-100"}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr className="border-t border-zinc-100"><td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-500">No appointments match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-zinc-400">Auto-refreshes every 30s.</p>
    </div>
  );
}

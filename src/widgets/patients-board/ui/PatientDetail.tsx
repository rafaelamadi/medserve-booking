"use client";

import Link from "next/link";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { usePatientDetail } from "@/entities/patient/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";

export function PatientDetail({ id }: { id: string }) {
  const q = usePatientDetail(id);
  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading patient…</p>;
  if (q.error || !q.data) return <p className="text-sm text-red-600">Patient not found.</p>;
  const p = q.data;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h1 className="text-base font-semibold">{p.fullName}</h1>
        <p className="text-sm text-zinc-500">{p.phone}{p.email ? ` · ${p.email}` : ""}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Centre · Service</th><th className="px-3 py-2">Status</th></tr>
          </thead>
          <tbody>
            {p.appointments.map((a) => (
              <tr key={a.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 whitespace-nowrap">{toCentreLocal(new Date(a.startsAt), a.centre.timezone)}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  <Link href={`/hub/appointments/${a.id}`} className="underline">{a.reference}</Link>
                </td>
                <td className="px-3 py-2">{a.centre.code} · {a.centreService.service.name}</td>
                <td className="px-3 py-2">{a.status}</td>
              </tr>
            ))}
            {p.appointments.length === 0 && (
              <tr className="border-t border-zinc-100"><td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-500">No visits.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

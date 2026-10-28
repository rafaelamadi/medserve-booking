"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { usePatients } from "@/entities/patient/api/hooks";

export function PatientsBoard() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);
  const q = usePatients(debounced);

  return (
    <div className="space-y-3">
      <input
        className="h-10 w-full max-w-sm rounded-md border border-zinc-200 bg-white px-3 text-sm"
        placeholder="Search name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {q.isLoading && <p className="text-sm text-zinc-500">Loading patients…</p>}
      {q.data && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Visits</th></tr>
            </thead>
            <tbody>
              {q.data.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/hub/patients/${p.id}`} className="underline">{p.fullName}</Link>
                  </td>
                  <td className="px-3 py-2">{p.phone}</td>
                  <td className="px-3 py-2">{p.email ?? "—"}</td>
                  <td className="px-3 py-2">{p._count.appointments}</td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr className="border-t border-zinc-100"><td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-500">No patients match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

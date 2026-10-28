"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setSelectedCentre } from "../api/centreScope";

export function CentreSwitcher({
  centres,
  selectedId,
}: {
  centres: Array<{ id: string; code: string; name: string }>;
  selectedId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (centres.length <= 1) {
    return <span className="text-sm font-medium">{centres[0]?.code ?? "No centre"}</span>;
  }

  async function onChange(id: string) {
    setBusy(true);
    await setSelectedCentre(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      aria-label="Working centre"
      className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
      value={selectedId ?? ""}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
    >
      {centres.map((c) => (
        <option key={c.id} value={c.id}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}

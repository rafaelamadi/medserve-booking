"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { createClosure, deleteClosure, saveAvailabilityRules } from "../api/actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

type Rule = { dayOfWeek: number; startMinute: number; endMinute: number };
type Closure = {
  id: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
  resource: { name: string } | null;
};

const toHHmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function AvailabilitySection({
  centreId,
  centreServices,
  rulesByService,
  closures,
  resources,
}: {
  centreId: string;
  centreServices: Array<{ id: string; serviceName: string }>;
  rulesByService: Record<string, Rule[]>;
  closures: Closure[];
  resources: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(centreServices[0]?.id ?? "");
  const [rows, setRows] = useState<Record<number, { on: boolean; start: string; end: string }>>(() =>
    initRows(rulesByService[centreServices[0]?.id ?? ""] ?? []),
  );
  const [saveState, setSaveState] = useState<{ error?: string; saved?: boolean }>({});
  const [saving, setSaving] = useState(false);

  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cResource, setCResource] = useState("");
  const [cReason, setCReason] = useState("");
  const [cError, setCError] = useState<string | null>(null);

  function initRows(rules: Rule[]) {
    const out: Record<number, { on: boolean; start: string; end: string }> = {};
    for (let d = 0; d <= 6; d++) {
      const r = rules.find((x) => x.dayOfWeek === d);
      out[d] = r ? { on: true, start: toHHmm(r.startMinute), end: toHHmm(r.endMinute) } : { on: false, start: "08:00", end: "17:00" };
    }
    return out;
  }

  function pick(id: string) {
    setSelected(id);
    setRows(initRows(rulesByService[id] ?? []));
    setSaveState({});
  }

  async function save() {
    setSaving(true);
    setSaveState({});
    const payload = Object.entries(rows)
      .filter(([, r]) => r.on)
      .map(([d, r]) => ({ dayOfWeek: Number(d), start: r.start, end: r.end }));
    const res = await saveAvailabilityRules(selected, payload);
    setSaving(false);
    if (!res.ok) setSaveState({ error: res.error });
    else {
      setSaveState({ saved: true });
      router.refresh();
    }
  }

  async function addClosure(e: React.FormEvent) {
    e.preventDefault();
    setCError(null);
    const res = await createClosure({
      centreId,
      resourceId: cResource,
      startsOn: cStart,
      endsOn: cEnd,
      reason: cReason,
    });
    if (!res.ok) setCError(res.error);
    else {
      setCStart("");
      setCEnd("");
      setCReason("");
      setCResource("");
      router.refresh();
    }
  }

  async function removeClosure(id: string) {
    if (!confirm("Remove this closure?")) return;
    await deleteClosure(id);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Weekly hours</h2>
        <label className={`${labelCls} max-w-sm`}>Centre service
          <select className={inputCls} value={selected} onChange={(e) => pick(e.target.value)}>
            {centreServices.map((cs) => (
              <option key={cs.id} value={cs.id}>{cs.serviceName}</option>
            ))}
          </select>
        </label>
        {selected ? (
          <>
            <div className="grid gap-2 md:grid-cols-2">
              {DAYS.map((name, d) => (
                <div key={d} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={rows[d]?.on ?? false}
                    onChange={(e) => setRows((p) => ({ ...p, [d]: { ...p[d], on: e.target.checked } }))}
                  />
                  <span className="w-10 text-sm font-medium">{name}</span>
                  <input
                    type="time"
                    className={inputCls}
                    value={rows[d]?.start ?? "08:00"}
                    disabled={!rows[d]?.on}
                    onChange={(e) => setRows((p) => ({ ...p, [d]: { ...p[d], start: e.target.value } }))}
                  />
                  <input
                    type="time"
                    className={inputCls}
                    value={rows[d]?.end ?? "17:00"}
                    disabled={!rows[d]?.on}
                    onChange={(e) => setRows((p) => ({ ...p, [d]: { ...p[d], end: e.target.value } }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save hours"}</Button>
              {saveState.error && <span className="text-xs text-red-600">{saveState.error}</span>}
              {saveState.saved && <span className="text-xs text-green-700">Saved</span>}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">Enable a service at this centre first.</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Closures ({closures.length})</h2>
        <form onSubmit={addClosure} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-5">
          <label className={labelCls}>From<input type="date" className={inputCls} value={cStart} onChange={(e) => setCStart(e.target.value)} required /></label>
          <label className={labelCls}>To<input type="date" className={inputCls} value={cEnd} onChange={(e) => setCEnd(e.target.value)} required /></label>
          <label className={labelCls}>Resource
            <select className={inputCls} value={cResource} onChange={(e) => setCResource(e.target.value)}>
              <option value="">Whole centre</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className={labelCls}>Reason<input className={inputCls} value={cReason} onChange={(e) => setCReason(e.target.value)} /></label>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">Add</Button>
            {cError && <span className="text-xs text-red-600">{cError}</span>}
          </div>
        </form>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Scope</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody>
              {closures.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{c.startsOn}</td>
                  <td className="px-3 py-2">{c.endsOn}</td>
                  <td className="px-3 py-2">{c.resource?.name ?? "Whole centre"}</td>
                  <td className="px-3 py-2">{c.reason ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs underline" onClick={() => removeClosure(c.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

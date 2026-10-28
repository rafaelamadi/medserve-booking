"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { createCentre, updateCentre } from "../api/centreActions";

type Centre = {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  phone: string;
  timezone: string;
  cancelCutoffHours: number;
  maxPatientReschedules: number;
  minLeadMinutes: number;
  bookingWindowDays: number;
  resultNudgeDays: number;
  isActive: boolean;
};

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

const EMPTY = {
  code: "",
  name: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  timezone: "Africa/Lagos",
  cancelCutoffHours: 24,
  maxPatientReschedules: 2,
  minLeadMinutes: 120,
  bookingWindowDays: 90,
  resultNudgeDays: 5,
  isActive: true,
};

function CentreForm({
  initial,
  onDone,
}: {
  initial?: Centre;
  onDone: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial ? { ...initial, address: initial.address ?? "" } : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, val: string | number | boolean) =>
    setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...v, code: v.code.toUpperCase() };
    const res = initial ? await updateCentre(initial.id, payload) : await createCentre(payload);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else {
      onDone();
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-4">
      <label className={labelCls}>Code<input className={inputCls} value={v.code} disabled={!!initial} onChange={(e) => set("code", e.target.value)} required /></label>
      <label className={labelCls}>Name<input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} required /></label>
      <label className={labelCls}>City<input className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} required /></label>
      <label className={labelCls}>State<input className={inputCls} value={v.state} onChange={(e) => set("state", e.target.value)} required /></label>
      <label className={labelCls}>Phone<input className={inputCls} value={v.phone} onChange={(e) => set("phone", e.target.value)} required /></label>
      <label className={labelCls}>Timezone<input className={inputCls} value={v.timezone} onChange={(e) => set("timezone", e.target.value)} /></label>
      <label className={labelCls}>Address<input className={inputCls} value={v.address} onChange={(e) => set("address", e.target.value)} /></label>
      <label className={labelCls}>Cancel cutoff (h)<input type="number" className={inputCls} value={v.cancelCutoffHours} onChange={(e) => set("cancelCutoffHours", Number(e.target.value))} /></label>
      <label className={labelCls}>Max reschedules<input type="number" className={inputCls} value={v.maxPatientReschedules} onChange={(e) => set("maxPatientReschedules", Number(e.target.value))} /></label>
      <label className={labelCls}>Lead time (min)<input type="number" className={inputCls} value={v.minLeadMinutes} onChange={(e) => set("minLeadMinutes", Number(e.target.value))} /></label>
      <label className={labelCls}>Window (days)<input type="number" className={inputCls} value={v.bookingWindowDays} onChange={(e) => set("bookingWindowDays", Number(e.target.value))} /></label>
      <label className={labelCls}>Nudge (days)<input type="number" className={inputCls} value={v.resultNudgeDays} onChange={(e) => set("resultNudgeDays", Number(e.target.value))} /></label>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
      </label>
      <div className="col-span-2 flex items-center gap-2 md:col-span-4">
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : initial ? "Save" : "Add centre"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}

export function CentresSection({ centres, canCreate }: { centres: Centre[]; canCreate: boolean }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Centres ({centres.length})</h2>
        {canCreate && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add centre</Button>
        )}
      </div>
      {adding && <CentreForm onDone={() => setAdding(false)} />}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">City</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {centres.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium">{c.code}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.city}, {c.state}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs underline" onClick={() => setEditing(editing === c.id ? null : c.id)}>Edit</button>
                  </td>
                </tr>
                {editing === c.id && (
                  <tr className="border-t border-zinc-100">
                    <td colSpan={6} className="px-3 py-2">
                      <CentreForm initial={c} onDone={() => setEditing(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { createService, updateService } from "../api/serviceActions";

type Service = {
  id: string;
  slug: string;
  name: string;
  category: "DIAGNOSTIC" | "ONCOLOGY";
  description: string | null;
  prepInstructions: string | null;
  defaultDurationMin: number;
  supportsSeries: boolean;
  isActive: boolean;
};

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

const EMPTY = {
  slug: "",
  name: "",
  category: "DIAGNOSTIC" as const,
  description: "",
  prepInstructions: "",
  defaultDurationMin: 30,
  supportsSeries: false,
  isActive: true,
};

function ServiceForm({ initial, onDone }: { initial?: Service; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState(
    initial
      ? { ...initial, description: initial.description ?? "", prepInstructions: initial.prepInstructions ?? "" }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, val: string | number | boolean) => setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...v, slug: v.slug.toLowerCase() };
    const res = initial ? await updateService(initial.id, payload) : await createService(payload);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else {
      onDone();
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <label className={labelCls}>Slug<input className={inputCls} value={v.slug} disabled={!!initial} onChange={(e) => set("slug", e.target.value)} required /></label>
      <label className={labelCls}>Name<input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} required /></label>
      <label className={labelCls}>Category
        <select className={inputCls} value={v.category} onChange={(e) => set("category", e.target.value)}>
          <option value="DIAGNOSTIC">DIAGNOSTIC</option>
          <option value="ONCOLOGY">ONCOLOGY</option>
        </select>
      </label>
      <label className={labelCls}>Default duration (min)<input type="number" className={inputCls} value={v.defaultDurationMin} onChange={(e) => set("defaultDurationMin", Number(e.target.value))} /></label>
      <label className={`${labelCls} col-span-2`}>Description<input className={inputCls} value={v.description} onChange={(e) => set("description", e.target.value)} /></label>
      <label className={`${labelCls} col-span-2`}>Prep instructions (shown to patients)<input className={inputCls} value={v.prepInstructions} onChange={(e) => set("prepInstructions", e.target.value)} /></label>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <input type="checkbox" checked={v.supportsSeries} onChange={(e) => set("supportsSeries", e.target.checked)} /> Supports series
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
      </label>
      <div className="col-span-2 flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : initial ? "Save" : "Add service"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}

export function ServicesSection({ services, canEdit }: { services: Service[]; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Services ({services.length})</h2>
        {canEdit && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add service</Button>
        )}
      </div>
      {adding && <ServiceForm onDone={() => setAdding(false)} />}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Series</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <Fragment key={s.id}>
                <tr className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.category}</td>
                  <td className="px-3 py-2">{s.supportsSeries ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{s.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2 text-right">
                    {canEdit && <button className="text-xs underline" onClick={() => setEditing(editing === s.id ? null : s.id)}>Edit</button>}
                  </td>
                </tr>
                {editing === s.id && (
                  <tr className="border-t border-zinc-100">
                    <td colSpan={5} className="px-3 py-2">
                      <ServiceForm initial={s} onDone={() => setEditing(null)} />
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

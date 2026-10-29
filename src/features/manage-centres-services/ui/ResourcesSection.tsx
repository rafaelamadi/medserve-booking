"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { createResource, updateResource } from "../api/resourceActions";

type Resource = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

function ResourceForm({
  centreId,
  initial,
  onDone,
}: {
  centreId: string;
  initial?: Resource;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = initial
      ? await updateResource(initial.id, { name, type, isActive })
      : await createResource({ centreId, name, type, isActive });
    setSaving(false);
    if (!res.ok) setError(res.error);
    else {
      onDone();
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <label className={labelCls}>Resource Name<input className={inputCls} placeholder="e.g. Clinical Resource 1" value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className={labelCls}>Resource Type<input className={inputCls} placeholder="e.g. ROOM" value={type} onChange={(e) => setType(e.target.value)} required /></label>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <div className="col-span-2 flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : initial ? "Save" : "Add resource"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}

export function ResourcesSection({ centreId, items }: { centreId: string; items: Resource[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Resources ({items.length})</h2>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add resource</Button>
        )}
      </div>
      {adding && <ResourceForm centreId={centreId} onDone={() => setAdding(false)} />}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">{r.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs underline" onClick={() => setEditing(editing === r.id ? null : r.id)}>Edit</button>
                  </td>
                </tr>
                {editing === r.id && (
                  <tr className="border-t border-zinc-100">
                    <td colSpan={4} className="px-3 py-2">
                      <ResourceForm centreId={centreId} initial={r} onDone={() => setEditing(null)} />
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

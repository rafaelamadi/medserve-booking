"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { createHoliday, deleteHoliday } from "../api/actions";

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

type Holiday = {
  id: string;
  date: string;
  name: string;
  centre: { code: string } | null;
};

export function HolidaysSection({
  holidays,
  centres,
  canAddGlobal,
}: {
  holidays: Holiday[];
  centres: Array<{ id: string; code: string }>;
  canAddGlobal: boolean;
}) {
  const router = useRouter();
  const [scope, setScope] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await createHoliday({ centreId: scope, date, name });
    if (!res.ok) setError(res.error);
    else {
      setDate("");
      setName("");
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this holiday?")) return;
    await deleteHoliday(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Holiday calendar ({holidays.length})</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-4">
        <label className={labelCls}>Scope
          <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            {canAddGlobal && <option value="">All centres (global)</option>}
            {centres.map((c) => (
              <option key={c.id} value={c.id}>{c.code} only</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>Date<input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className={labelCls}>Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">Add</Button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Scope</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{h.date}</td>
                <td className="px-3 py-2">{h.name}</td>
                <td className="px-3 py-2">{h.centre ? h.centre.code : "Global"}</td>
                <td className="px-3 py-2 text-right">
                  <button className="text-xs underline" onClick={() => remove(h.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

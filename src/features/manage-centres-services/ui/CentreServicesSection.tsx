"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { upsertCentreService } from "../api/centreServiceActions";

type Item = {
  id: string;
  confirmationMode: "AUTO" | "REVIEW";
  slotMinutes: number;
  capacityPerSlot: number;
  resultInstruction: string | null;
  isActive: boolean;
  service: { id: string; name: string; slug: string; category: string };
  resource: { id: string; name: string } | null;
};

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

export function CentreServicesSection({
  centreId,
  items,
  availableServices,
  resources,
}: {
  centreId: string;
  items: Item[];
  availableServices: Array<{ id: string; name: string }>;
  resources: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [mode, setMode] = useState<"AUTO" | "REVIEW">("REVIEW");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [resourceId, setResourceId] = useState("");
  const [instruction, setInstruction] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load(item: Item, svcId: string) {
    setServiceId(svcId);
    setMode(item.confirmationMode);
    setSlotMinutes(item.slotMinutes);
    setCapacity(item.capacityPerSlot);
    setResourceId(item.resource?.id ?? "");
    setInstruction(item.resultInstruction ?? "");
    setActive(item.isActive);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId) {
      setError("Pick a service");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await upsertCentreService({
      centreId,
      serviceId,
      confirmationMode: mode,
      slotMinutes,
      capacityPerSlot: capacity,
      resourceId,
      resultInstruction: instruction,
      isActive: active,
    });
    setSaving(false);
    if (!res.ok) setError(res.error);
    else {
      setServiceId("");
      setInstruction("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Centre services ({items.length})</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-4">
        <label className={labelCls}>Service
          <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">Select…</option>
            {availableServices.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>Mode
          <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as "AUTO" | "REVIEW")}>
            <option value="REVIEW">REVIEW (staff confirm)</option>
            <option value="AUTO">AUTO (instant confirm)</option>
          </select>
        </label>
        <label className={labelCls}>Slot (min)<input type="number" className={inputCls} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} /></label>
        <label className={labelCls}>Capacity<input type="number" className={inputCls} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></label>
        <label className={labelCls}>Resource (optional)
          <select className={inputCls} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            <option value="">None (own capacity)</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>Result instruction<input className={inputCls} value={instruction} onChange={(e) => setInstruction(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
        <div className="col-span-2 flex items-center gap-2 md:col-span-4">
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Service</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2">Slot</th><th className="px-3 py-2">Cap</th><th className="px-3 py-2">Resource</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium">{i.service.name}</td>
                <td className="px-3 py-2">{i.confirmationMode}</td>
                <td className="px-3 py-2">{i.slotMinutes}m</td>
                <td className="px-3 py-2">{i.capacityPerSlot}</td>
                <td className="px-3 py-2">{i.resource?.name ?? "—"}</td>
                <td className="px-3 py-2">{i.isActive ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2 text-right">
                  <button className="text-xs underline" onClick={() => load(i, i.service.id)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

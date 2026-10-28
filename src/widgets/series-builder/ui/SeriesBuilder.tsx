"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// Deep imports: client bundles must not pull server-only modules via barrels.
import { useSeriesPreview } from "@/entities/care-series/api/hooks";
import type { SeriesPattern } from "@/entities/care-series/model/types";
import { usePatientLookup } from "@/entities/patient/api/hooks";
import { useCreateSeries } from "@/features/create-care-series/api/hooks";
import { Button } from "@/shared/ui";

const inputCls = "h-10 w-full rounded-md border border-zinc-300 px-3 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

export function SeriesBuilder({
  centreCode,
  services,
}: {
  centreCode: string;
  services: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [pattern, setPattern] = useState<SeriesPattern>("DAILY_WORKING_DAYS");
  const [intervalN, setIntervalN] = useState(1);
  const [totalSessions, setTotalSessions] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [sessionTime, setSessionTime] = useState("08:00");
  const [customText, setCustomText] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const lookup = usePatientLookup(phone);
  const create = useCreateSeries();

  const customDates = useMemo(
    () =>
      customText
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    [customText],
  );

  const previewInput = useMemo(() => {
    if (!serviceId || !startDate || !sessionTime) return null;
    if (pattern === "CUSTOM_DATES") {
      if (customDates.length === 0) return null;
      return { centreServiceId: serviceId, pattern, totalSessions: customDates.length, startDate, sessionTime, customDates };
    }
    if (totalSessions < 1) return null;
    if (pattern !== "DAILY_WORKING_DAYS" && intervalN < 1) return null;
    return { centreServiceId: serviceId, pattern, intervalN, totalSessions, startDate, sessionTime };
  }, [serviceId, pattern, intervalN, totalSessions, startDate, sessionTime, customDates]);

  const preview = useSeriesPreview(previewInput);
  const conflicts = (preview.data?.sessions ?? []).filter((s) => s.conflict && !excluded.has(s.date));

  function toggleExclude(date: string) {
    setExcluded((p) => {
      const n = new Set(p);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (conflicts.length > 0) {
      setError("Resolve conflicts first — exclude them or pick another time");
      return;
    }
    const res = await create.mutateAsync({
      centreServiceId: serviceId,
      patient: { phone, fullName, email: email || undefined },
      pattern,
      intervalN,
      totalSessions: pattern === "CUSTOM_DATES" ? customDates.length : totalSessions,
      startDate,
      sessionTime,
      customDates: pattern === "CUSTOM_DATES" ? customDates : undefined,
      excludeDates: [...excluded],
    });
    if (!res.ok) setError("conflicts" in res && res.conflicts ? `Still conflicting: ${res.conflicts.join(", ")}` : res.error);
    else router.push(`/hub/series/${res.seriesId}`);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <label className={labelCls}>Patient phone
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0803 123 4567" />
        </label>
        <label className={labelCls}>Full name
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className={labelCls}>Email (optional)
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {lookup.data && (
          <p className="text-xs text-zinc-500 md:col-span-3">
            Records found for {lookup.data.fullName}.
            <button type="button" className="ml-2 underline" onClick={() => { const d = lookup.data; if (d) { setFullName(d.fullName); setEmail(d.email ?? ""); } }}>
              Fill from records
            </button>
          </p>
        )}
      </div>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <p className="text-xs text-zinc-500 md:col-span-4">Centre: <span className="font-semibold">{centreCode}</span> (switch the working centre above to build elsewhere)</p>
        <label className={labelCls}>Service (series-capable)
          <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>Pattern
          <select className={inputCls} value={pattern} onChange={(e) => setPattern(e.target.value as SeriesPattern)}>
            <option value="DAILY_WORKING_DAYS">Daily working days</option>
            <option value="EVERY_N_DAYS">Every N days</option>
            <option value="EVERY_N_WEEKS">Every N weeks</option>
            <option value="CUSTOM_DATES">Custom dates</option>
          </select>
        </label>
        {(pattern === "EVERY_N_DAYS" || pattern === "EVERY_N_WEEKS") && (
          <label className={labelCls}>Every N
            <input type="number" min={1} className={inputCls} value={intervalN} onChange={(e) => setIntervalN(Number(e.target.value))} />
          </label>
        )}
        {pattern !== "CUSTOM_DATES" && (
          <label className={labelCls}>Sessions
            <input type="number" min={1} max={100} className={inputCls} value={totalSessions} onChange={(e) => setTotalSessions(Number(e.target.value))} />
          </label>
        )}
        <label className={labelCls}>Start date
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label className={labelCls}>Session time
          <input type="time" className={inputCls} value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} required />
        </label>
        {pattern === "CUSTOM_DATES" && (
          <label className={`${labelCls} md:col-span-4`}>Dates (YYYY-MM-DD, comma/space separated)
            <textarea className="min-h-20 w-full rounded-md border border-zinc-300 p-2 text-sm" value={customText} onChange={(e) => setCustomText(e.target.value)} />
          </label>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Preview — skipped days and conflicts</h2>
        {preview.isLoading && <p className="mt-2 text-sm text-zinc-500">Generating preview…</p>}
        {preview.error && <p className="mt-2 text-sm text-red-600">Preview failed.</p>}
        {preview.data && (
          <>
            {(preview.data.skipped.length > 0) && (
              <p className="mt-2 text-xs text-zinc-500">
                Skipped: {preview.data.skipped.map((s) => `${s.date} (${s.reason})`).join(", ")}
              </p>
            )}
            <div className="mt-2 max-h-72 overflow-y-auto rounded border border-zinc-100">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                  <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Time</th><th className="px-3 py-2">Note</th><th className="px-3 py-2">Drop</th></tr>
                </thead>
                <tbody>
                  {preview.data.sessions.map((s, i) => (
                    <tr key={s.date} className={`border-t border-zinc-100 ${s.conflict && !excluded.has(s.date) ? "bg-red-50" : excluded.has(s.date) ? "opacity-40" : ""}`}>
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5 font-medium">{s.date}</td>
                      <td className="px-3 py-1.5">{s.time}</td>
                      <td className="px-3 py-1.5 text-xs">
                        {s.adjustedFrom && <span className="text-amber-700">moved from {s.adjustedFrom}</span>}
                        {s.conflict && !excluded.has(s.date) && <span className="text-red-700"> conflict — drop or retime</span>}
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={excluded.has(s.date)} onChange={() => toggleExclude(s.date)} aria-label={`Drop ${s.date}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={create.isPending || !previewInput}>
        {create.isPending ? "Saving…" : "Confirm series — patient will be notified"}
      </Button>
    </form>
  );
}

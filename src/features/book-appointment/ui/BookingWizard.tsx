"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { submitBooking } from "../api/actions";
import { usePublicCentreServices, usePublicCentres, usePublicSlots } from "../api/hooks";

const inputCls = "h-11 w-full rounded-md border border-zinc-300 px-3 text-base";
const labelCls = "block text-sm font-medium text-zinc-700";

type Alt = { start: string; date: string };

export function BookingWizard({
  initialCentreId,
  initialServiceId,
}: {
  initialCentreId?: string;
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialCentreId ? 1 : 0);
  const [centreId, setCentreId] = useState(initialCentreId ?? "");
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alt[]>([]);

  const centresQ = usePublicCentres();
  const servicesQ = usePublicCentreServices(centreId || null);
  const slotsQ = usePublicSlots(serviceId || null, date || null);

  const services = useMemo(() => servicesQ.data ?? [], [servicesQ.data]);
  const mode = services.find((s) => s.id === serviceId)?.confirmationMode;
  const slots = slotsQ.data?.slots ?? [];

  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setAlternatives([]);
    const res = await submitBooking({
      centreId,
      centreServiceId: serviceId,
      date,
      time,
      fullName,
      phone,
      email,
      note,
      consent,
      company: "",
      startedAt,
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/book/confirmed/${res.reference}`);
    } else {
      setError(res.error);
      if (res.code === "SLOT_TAKEN" && res.alternatives) setAlternatives(res.alternatives);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Step 0: centre */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">1. Choose a centre</h2>
        <div className="mt-3 grid gap-2">
          {centresQ.isLoading && <p className="text-sm text-zinc-500">Loading centres…</p>}
          {centresQ.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCentreId(c.id);
                setServiceId("");
                setStep(1);
              }}
              className={`rounded-lg border p-3 text-left ${centreId === c.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"}`}
            >
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.city}, {c.state} · {c.phone}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 1: service */}
      {step >= 1 && centreId && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">2. Choose a service</h2>
          <div className="mt-3 grid gap-2">
            {servicesQ.isLoading && <p className="text-sm text-zinc-500">Loading services…</p>}
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStep(2);
                }}
                className={`rounded-lg border p-3 text-left ${serviceId === s.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"}`}
              >
                <p className="text-sm font-semibold">{s.service.name}</p>
                <p className="text-xs text-zinc-500">
                  {s.service.category} · {s.confirmationMode === "AUTO" ? "Instant confirmation" : "Centre confirms"}
                </p>
              </button>
            ))}
            {servicesQ.data && services.length === 0 && (
              <p className="text-sm text-zinc-500">No services at this centre yet.</p>
            )}
          </div>
        </section>
      )}

      {/* Step 2: date + time */}
      {step >= 2 && serviceId && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">3. Pick a date and time</h2>
          <label className={`${labelCls} mt-3`}>Date
            <input type="date" className={inputCls} min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required />
          </label>
          {date && (
            <div className="mt-3">
              {slotsQ.isLoading && <p className="text-sm text-zinc-500">Checking availability…</p>}
              {slotsQ.data?.closed && <p className="text-sm text-amber-700">Centre is closed on this date.</p>}
              {slotsQ.data?.outOfWindow && <p className="text-sm text-amber-700">Date is outside the booking window.</p>}
              {slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setTime(s.start)}
                      className={`rounded-lg border py-2 text-sm font-medium ${time === s.start ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200"}`}
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              ) : (
                !slotsQ.isLoading && !slotsQ.data?.closed && (
                  <p className="text-sm text-zinc-500">No open times on this date — try another day.</p>
                )
              )}
              {mode === "REVIEW" && (
                <p className="mt-2 text-xs text-zinc-500">
                  This service needs centre confirmation. If your preferred time is full, pick the closest time and the centre will confirm or adjust it.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step 3: details */}
      {step >= 2 && serviceId && time && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">4. Your details</h2>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <label className={labelCls}>Full name
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </label>
            <label className={labelCls}>Phone (Nigeria)
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" placeholder="0803 123 4567" />
            </label>
            <label className={labelCls}>Email (optional)
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className={labelCls}>Note for the centre (optional)
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
              I consent to MedServe using my details to manage this booking (privacy notice).
            </label>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
                {alternatives.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alternatives.map((a) => (
                      <button key={a.start} type="button" className="rounded border border-red-300 bg-white px-2 py-1 text-xs" onClick={() => { setTime(a.start); setError(null); setAlternatives([]); }}>
                        Take {a.start}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting || !consent}>
              {submitting ? "Booking…" : mode === "AUTO" ? "Confirm booking" : "Request booking"}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

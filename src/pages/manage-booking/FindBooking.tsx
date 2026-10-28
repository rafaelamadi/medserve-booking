"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/features/verify-phone-otp/api/otp";
import { Button } from "@/shared/ui";

const inputCls = "h-11 w-full rounded-md border border-zinc-300 px-3 text-base";
const labelCls = "block text-sm font-medium text-zinc-700";

/** FR-M1: reference + phone entry, verified by OTP. No account. */
export function FindBooking({ prefillRef }: { prefillRef?: string }) {
  const router = useRouter();
  const [reference, setReference] = useState(prefillRef ?? "");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await requestOtp({ phone, reference });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else {
      setCodeSent(true);
      // Dev-only test aid (dead code in production builds).
      if (process.env.NODE_ENV !== "production" && "devCode" in res && res.devCode) {
        setDevCode(res.devCode);
      }
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await verifyOtp({ phone, code });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else router.push(`/manage/${reference.trim().toUpperCase()}`);
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Find your booking</h1>
      <p className="mt-1 text-sm text-zinc-500">Enter your reference and phone number. We’ll text you a code.</p>
      {!codeSent ? (
        <form onSubmit={send} className="mt-4 space-y-3">
          <label className={labelCls}>Booking reference
            <input className={`${inputCls} font-mono uppercase`} value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="MS-MLCC-XXXXXX" />
          </label>
          <label className={labelCls}>Phone
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" placeholder="0803 123 4567" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Text me a code"}</Button>
        </form>
      ) : (
        <form onSubmit={confirm} className="mt-4 space-y-3">
          <label className={labelCls}>6-digit code
            <input className={`${inputCls} font-mono`} value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric" maxLength={6} />
          </label>
          {devCode && process.env.NODE_ENV !== "production" && (
            <p className="text-xs text-zinc-400" data-testid="dev-otp-code">Dev code: {devCode}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Checking…" : "View booking"}</Button>
          <button type="button" className="w-full text-sm underline" onClick={() => setCodeSent(false)}>Use a different number</button>
        </form>
      )}
    </div>
  );
}

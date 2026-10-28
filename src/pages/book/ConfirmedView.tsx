"use client";

import Link from "next/link";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
// Deep import: the feature barrel also re-exports server-only modules.
import { useBookingConfirmation } from "@/features/book-appointment/api/hooks";
import { toCentreLocal } from "@/shared/lib/datetime";

export function ConfirmedView({ reference }: { reference: string }) {
  const q = useBookingConfirmation(reference);
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <CalendarCheck size={36} className="mx-auto text-zinc-900" />
        {q.isLoading && <p className="mt-3 text-sm text-zinc-500">Loading confirmation…</p>}
        {q.data == null && !q.isLoading && (
          <p className="mt-3 text-sm text-red-600">Booking not found. Check the reference.</p>
        )}
        {q.data && (
          <>
            <h1 className="mt-2 text-xl font-semibold">
              {q.data.status === "CONFIRMED" ? "Booking confirmed" : "Request received"}
            </h1>
            <p className="mt-1 font-mono text-lg font-bold">{q.data.reference}</p>
            <dl className="mt-4 space-y-2 text-left text-sm">
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Service</dt><dd className="font-medium">{q.data.serviceName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Centre</dt><dd className="font-medium">{q.data.centreName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">When</dt><dd className="font-medium">{toCentreLocal(new Date(q.data.startsAt), q.data.centreTimezone)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Centre line</dt><dd className="font-medium">{q.data.centrePhone}</dd></div>
            </dl>
            {q.data.status === "REQUESTED" && (
              <p className="mt-3 text-sm text-amber-700">The centre will confirm this request shortly.</p>
            )}
            {q.data.prepInstructions && (
              <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-left text-sm">
                <span className="font-semibold">How to prepare: </span>{q.data.prepInstructions}
              </p>
            )}
          </>
        )}
        <Link href="/book" className="mt-6 inline-block text-sm underline">Book another</Link>
      </div>
    </div>
  );
}

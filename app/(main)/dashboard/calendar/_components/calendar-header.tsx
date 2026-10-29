"use client";

import { useCentreScope } from "@/shared/context/centre-scope-context";

export function CalendarHeader() {
  const { selectedCentre } = useCentreScope();
  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Centre Master Calendar
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {isAll
          ? "Live scheduling grid across appointments and consultations for Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC)."
          : `Live scheduling grid across appointments and consultations for ${selectedCentre.name} (${selectedCentre.city}).`}
      </p>
    </div>
  );
}

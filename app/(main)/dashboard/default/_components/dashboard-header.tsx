"use client";

import { useCentreScope } from "@/shared/context/centre-scope-context";

export function DashboardHeader() {
  const { selectedCentre } = useCentreScope();
  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Appointments Overview
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          {isAll
            ? "View today's schedule and manage patient visits across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC)."
            : `View today's schedule and patient visits for ${selectedCentre.name} (${selectedCentre.city}).`}
        </p>
      </div>
    </div>
  );
}


"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCentreScope } from "@/shared/context/centre-scope-context";
import { NewAppointmentDialog } from "../../appointments/_components/new-appointment-dialog";

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
            ? "View today's schedule, manage patient visits, and book appointments across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC)."
            : `View today's schedule and appointments for ${selectedCentre.name} (${selectedCentre.city}).`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NewAppointmentDialog
          trigger={
            <Button size="default" className="h-10 px-4 text-sm font-semibold shadow-sm gap-2 cursor-pointer">
              <Plus className="size-4" />
              Book Appointment
            </Button>
          }
        />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { useCentreScope } from "@/shared/context/centre-scope-context";
import { getLiveAppointmentsByCentre, type ClinicalAppointmentRow } from "@/server/appointments";

import { AppointmentsTable } from "./_components/appointments-table";
import { NewAppointmentDialog } from "./_components/new-appointment-dialog";

export default function AppointmentsPage() {
  const { selectedCentre } = useCentreScope();
  const [appointments, setAppointments] = useState<ClinicalAppointmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";

  const refreshAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const live = await getLiveAppointmentsByCentre(isAll ? undefined : selectedCentre?.code);
      setAppointments(live);
    } catch (err) {
      console.error("Failed to load live appointments from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAll, selectedCentre?.code]);

  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // Real-time synchronization: listen for events when actions occur
  useEffect(() => {
    const handleSync = () => {
      refreshAppointments();
    };

    window.addEventListener("medserve:appointment-sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("medserve:appointment-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refreshAppointments]);

  const displayedAppointments = appointments;

  const total = displayedAppointments.length;
  const checkedIn = displayedAppointments.filter((a) => a.status === "CHECKED_IN").length;
  const confirmed = displayedAppointments.filter((a) => a.status === "CONFIRMED").length;
  const scheduled = displayedAppointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "REQUESTED"
  ).length;

  const handleCreated = () => {
    refreshAppointments();
  };

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Booking Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clinical Appointments Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAll
              ? "Coordinate daily clinical appointments, patient check-ins, and schedule capacity across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC)."
              : `Coordinate daily clinical appointments, patient check-ins, and schedule capacity for ${selectedCentre.name} (${selectedCentre.city}).`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewAppointmentDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Queue Stat Counters */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total in Queue
            </span>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">visits total</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Scheduled
            </span>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{scheduled}</span>
            <span className="text-xs text-muted-foreground">upcoming arrival</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Checked In
            </span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {checkedIn}
            </span>
            <span className="text-xs text-muted-foreground">in waiting area</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium uppercase tracking-wider">
              Confirmed
            </span>
            <CheckCircle2 className="size-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
              {confirmed}
            </span>
            <span className="text-xs text-muted-foreground">session completed</span>
          </div>
        </Card>
      </div>

      {/* Main Filterable Clinical Appointments Table */}
      <div className="w-full">
        <AppointmentsTable data={displayedAppointments} showExport />
      </div>
    </div>
  );
}

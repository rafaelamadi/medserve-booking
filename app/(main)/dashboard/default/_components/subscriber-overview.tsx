"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveAppointmentsByCentre } from "@/server/appointments";
import { useCentreScope } from "@/shared/context/centre-scope-context";

import { RecentCustomersTable } from "./recent-customers-table/table";
import type { ClinicalAppointmentRow } from "./recent-customers-table/schema";

export function SubscriberOverview() {
  const { selectedCentre } = useCentreScope();
  const centreCode = selectedCentre?.code;
  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";

  const [appointments, setAppointments] = React.useState<ClinicalAppointmentRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Synchronize live data directly from Supabase
  const refreshAppointments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const live = await getLiveAppointmentsByCentre(isAll ? undefined : centreCode);
      setAppointments(live);
    } catch (err) {
      console.error("Error fetching live appointments from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAll, centreCode]);

  React.useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // Real-time synchronization: listen for events when actions occur
  React.useEffect(() => {
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

  const handleExport = () => {
    toast.success("Schedule Exported", {
      description: `Downloaded ${appointments.length} appointments for today as CSV.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="leading-none text-base md:text-lg">
              Today&apos;s Appointment Schedule
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              {appointments.length} Scheduled Visits
            </Badge>
          </div>
          <CardDescription>
            {isAll
              ? "Upcoming appointments across all MedServe centres (MLCC, MKDC & MUDC)."
              : `Upcoming appointments for ${selectedCentre.name} (${selectedCentre.city}).`}
          </CardDescription>
        </div>

        <CardAction className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs cursor-pointer" onClick={handleExport}>
            <Download className="size-3.5 mr-1" />
            Export Schedule
          </Button>
          <Button size="sm" className="h-9 text-xs cursor-pointer" asChild>
            <Link href="/dashboard/appointments">
              <CalendarPlus className="size-3.5 mr-1" />
              Manage All Bookings
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable data={appointments} />
      </CardContent>
    </Card>
  );
}

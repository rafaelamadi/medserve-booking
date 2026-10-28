"use client";

import { useState } from "react";
import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, Clock, PlayCircle, Plus, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ClinicalAppointment, TODAY_APPOINTMENTS } from "@/data/clinical-queue-data";

import { AppointmentsTable } from "./_components/appointments-table";
import { NewAppointmentDialog } from "./_components/new-appointment-dialog";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<ClinicalAppointment[]>(TODAY_APPOINTMENTS);

  const total = appointments.length;
  const checkedIn = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const inTreatment = appointments.filter((a) => a.status === "IN_TREATMENT").length;
  const rescheduleReq = appointments.filter((a) => a.status === "RESCHEDULE_REQUESTED").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;

  const handleCreated = (newApt: ClinicalAppointment) => {
    setAppointments((prev) => [newApt, ...prev]);
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
            Coordinate daily treatment sessions, patient check-ins, and vault capacity across MLCC, MKDC & MUDC
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
            <span className="text-xs text-muted-foreground">visits scheduled</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Checked In
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {checkedIn}
            </span>
            <span className="text-xs text-muted-foreground">in waiting area</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
              In Treatment
            </span>
            <PlayCircle className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {inTreatment}
            </span>
            <span className="text-xs text-muted-foreground">active beam/infusion</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-destructive/20 bg-destructive/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-destructive font-medium uppercase tracking-wider">
              Reschedules
            </span>
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-destructive tabular-nums">
              {rescheduleReq}
            </span>
            <span className="text-xs text-muted-foreground">awaiting decision</span>
          </div>
        </Card>
      </div>

      {/* Main Filterable Clinical Appointments Table */}
      <Card className="p-5 shadow-xs">
        <AppointmentsTable data={appointments} onDataChange={setAppointments} />
      </Card>
    </div>
  );
}

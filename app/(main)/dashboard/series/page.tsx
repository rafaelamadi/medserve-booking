"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Repeat,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { PATIENT_SCHEDULES, type PatientCareSchedule } from "@/data/care-series-data";

import { NewSeriesDialog } from "./_components/new-series-dialog";
import { SeriesTable } from "./_components/series-table";

export default function SeriesPage() {
  const [scheduleList, setScheduleList] = useState<PatientCareSchedule[]>(PATIENT_SCHEDULES);

  const total = scheduleList.length;
  const activeCount = scheduleList.filter((s) => s.status === "ACTIVE").length;
  const completedCount = scheduleList.filter((s) => s.status === "COMPLETED").length;
  const rescheduleReqCount = scheduleList.filter((s) => s.hasRescheduleRequest).length;

  const totalCompletedVisits = scheduleList.reduce(
    (acc, s) => acc + (s.completedVisits || 0),
    0,
  );

  const handleCreated = (newSchedule: PatientCareSchedule) => {
    setScheduleList((prev) => [newSchedule, ...prev]);
  };

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Patient Visit Schedules
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coordinate multi-day treatment courses, patient arrival calendars, service encounters, and clinical rooms
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewSeriesDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Visit Schedule Metric Counters */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Active Schedules
            </span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{activeCount}</span>
            <span className="text-xs text-muted-foreground">patients in active course</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Visits Completed
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {totalCompletedVisits}
            </span>
            <span className="text-xs text-muted-foreground">sessions completed</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
              Reschedule Requests
            </span>
            <AlertCircle className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {rescheduleReqCount}
            </span>
            <span className="text-xs text-muted-foreground">awaiting date change</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Completed Courses
            </span>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{completedCount}</span>
            <span className="text-xs text-muted-foreground">courses finished</span>
          </div>
        </Card>
      </div>

      {/* Main Filterable Patient Schedules Table */}
      <Card className="p-5 shadow-xs">
        <SeriesTable data={scheduleList} onDataChange={setScheduleList} />
      </Card>
    </div>
  );
}

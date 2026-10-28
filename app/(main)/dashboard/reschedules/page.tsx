"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Repeat,
  ShieldAlert,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  RESCHEDULE_REQUESTS_DATA,
  type RescheduleRequest,
} from "@/data/reschedules-data";

import { NewRescheduleRequestDialog } from "./_components/new-reschedule-request-dialog";
import { ReschedulesTable } from "./_components/reschedules-table";

export default function ReschedulesPage() {
  // Route is disabled per user request. Comment out notFound() below to re-enable when ready.
  notFound();

  const [requests, setRequests] = React.useState<RescheduleRequest[]>(
    RESCHEDULE_REQUESTS_DATA,
  );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const urgentCount = requests.filter(
    (r) =>
      r.status === "PENDING" &&
      (r.urgency === "URGENT" || r.urgency === "CRITICAL_BREAK"),
  ).length;
  const bulkSeriesCount = requests.filter((r) => r.isBulkSeries).length;
  const resolvedCount = requests.filter((r) => r.status !== "PENDING").length;

  const handleCreated = (newReq: RescheduleRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reschedules & Clinical Triage Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coordinate appointment slot adjustments, clinical delays, machine QA maintenance shifts, and automated care series date advancing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewRescheduleRequestDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
              Pending Review
            </span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {pendingCount}
            </span>
            <span className="text-xs text-muted-foreground">awaiting triage</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-red-500/20 bg-red-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-700 dark:text-red-400 font-medium uppercase tracking-wider">
              Urgent / Treatment Breaks
            </span>
            <ShieldAlert className="size-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 tabular-nums">
              {urgentCount}
            </span>
            <span className="text-xs text-muted-foreground">same-day / breaks</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Bulk Care Series
            </span>
            <Repeat className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {bulkSeriesCount}
            </span>
            <span className="text-xs text-muted-foreground">multi-session courses</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Resolved Requests
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {resolvedCount}
            </span>
            <span className="text-xs text-muted-foreground">actioned & notified</span>
          </div>
        </Card>
      </div>

      {/* Main Reschedules Table */}
      <Card className="p-5 shadow-xs">
        <ReschedulesTable data={requests} onDataChange={setRequests} />
      </Card>
    </div>
  );
}

"use client";

import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, Clock, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_METRICS } from "@/data/clinical-queue-data";

export function MetricCards() {
  const metrics = CLINICAL_METRICS.all;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Today's Appointments */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg border border-primary/20">
              <CalendarCheck className="size-4.5" />
            </div>
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Today&apos;s Appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.todayAppointments}
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              <CheckCircle2 className="size-3 mr-1" />
              {metrics.checkedIn} Checked-in
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {metrics.inTreatment} in treatment · {metrics.pendingConfirm} pending confirmation
          </p>
        </CardContent>
      </Card>

      {/* 2. Active Care Series */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 flex size-8 items-center justify-center rounded-lg border border-blue-500/20">
              <Repeat className="size-4.5" />
            </div>
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Care Series
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.activeSeries}
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium">
              Radiotherapy & Chemo
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            18 fractions scheduled today across MLCC, MKDC & MUDC
          </p>
        </CardContent>
      </Card>

      {/* 3. Machine Utilization */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 flex size-8 items-center justify-center rounded-lg border border-amber-500/20">
              <Activity className="size-4.5" />
            </div>
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Linac Machine Utilization
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.linacUtilization}
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
              Optimal Throughput
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Linac-1: 91% · Linac-2: 83% · CT Sim: 79%
          </p>
        </CardContent>
      </Card>

      {/* 4. Triage & Actions */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <div className="bg-destructive/10 text-destructive flex size-8 items-center justify-center rounded-lg border border-destructive/20">
              <AlertTriangle className="size-4.5" />
            </div>
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Triage & Pending Actions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.pendingTriage}
            </div>
            <Badge variant="destructive" className="font-medium">
              Action Required
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            3 Reschedule requests · 2 Series gap warnings · 1 Notice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

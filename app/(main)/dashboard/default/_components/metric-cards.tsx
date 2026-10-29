"use client";

import { CalendarCheck, CheckCircle2, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_METRICS } from "@/data/clinical-queue-data";
import { useCentreScope } from "@/shared/context/centre-scope-context";

export function MetricCards() {
  const { selectedCentre } = useCentreScope();
  const code = (selectedCentre?.code?.toLowerCase() || "all") as "mlcc" | "mkdc" | "mudc" | "all";
  const metrics = CLINICAL_METRICS[code] || CLINICAL_METRICS.all;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Today's Bookings */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <CalendarCheck className="size-5 text-primary" />
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Today&apos;s Bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.todayAppointments}
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              <CheckCircle2 className="size-3 mr-1" />
              {metrics.checkedIn} Arrived
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {metrics.inTreatment} currently in session
          </p>
        </CardContent>
      </Card>

      {/* 2. Confirmed Appointments */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Confirmed Visits
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.activeSeries}
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium">
              Ready for Visit
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Confirmed visits across all 3 centres
          </p>
        </CardContent>
      </Card>

      {/* 3. Checked-In Patients */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <Users className="size-5 text-blue-600 dark:text-blue-400" />
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Checked-In Patients
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.checkedIn}
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              At Clinic
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Patients currently waiting or receiving care
          </p>
        </CardContent>
      </Card>

      {/* 4. Pending Confirmation */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>
            <Clock className="size-5 text-amber-600 dark:text-amber-400" />
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending Confirmation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {metrics.pendingConfirm}
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
              Awaiting Action
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Bookings to be confirmed with patients
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


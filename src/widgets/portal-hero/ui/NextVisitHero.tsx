"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Printer,
  Repeat,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/shared/ui";
import type { RegisteredPatient } from "@/entities/patient";
import type { PatientCareSchedule } from "@/entities/care-series";

export interface NextVisitHeroProps {
  patient: RegisteredPatient;
  schedule?: PatientCareSchedule;
  onOpenReschedule: () => void;
  onOpenPass: () => void;
}

export function NextVisitHero({
  patient,
  schedule,
  onOpenReschedule,
  onOpenPass,
}: NextVisitHeroProps) {
  const nextVisit = patient.nextVisit || {
    date: schedule?.nextVisitDate || "2026-10-27",
    timeSlot: schedule?.nextVisitTime || "08:30 AM",
    service: schedule?.primaryService || patient.primaryService || "Radiotherapy Session",
    room: schedule?.room || "",
  };

  const nextSessionNumber = (patient.completedVisits || 0) + 1;
  const totalSessions = patient.totalVisits || schedule?.totalVisits || 25;

  return (
    <Card className="overflow-hidden border border-border/80 shadow-md bg-gradient-to-br from-card via-card to-primary/[0.03]">
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Highlighted Appointment Information */}
          <div className="space-y-4 max-w-2xl">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs px-2.5 py-0.5 font-medium gap-1.5 shadow-2xs">
                <span className="size-2 rounded-full bg-white animate-pulse" />
                Confirmed On Schedule
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs font-mono">
                Ref: {patient.scheduleRef || "SCH-MLCC-084"}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {patient.centreName}
              </span>
            </div>

            {/* Main Date & Time Headline */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Next Clinical Session
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                {nextVisit.date === "2026-10-27" ? "Tomorrow, 27 October 2026" : nextVisit.date}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-foreground mt-1.5">
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <Clock className="size-4" />
                  {nextVisit.timeSlot}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground text-xs">
                  Please arrive by <strong className="text-foreground">08:15 AM</strong> for vitals & prep
                </span>
              </div>
            </div>

            {/* Procedural & Room Details Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Repeat className="size-3.5 text-primary" />
                  <span>Procedure & Session</span>
                </div>
                <div className="font-bold text-foreground text-sm">
                  {nextVisit.service}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Session #{nextSessionNumber} of {totalSessions} · {schedule?.technique || "VMAT Delivery"}
                </p>
              </div>

              <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Location & Attending Team</span>
                </div>
                <div className="font-bold text-foreground text-sm">
                  {nextVisit.room || patient.centreName}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Attending: <strong className="text-foreground">{patient.doctorInCharge ? patient.doctorInCharge.replace(/^Attending\s+/i, "") : "Consultant"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Key Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center border-t lg:border-t-0 lg:border-l pt-5 lg:pt-0 lg:pl-8">
            <Button
              onClick={onOpenPass}
              size="lg"
              className="gap-2 font-semibold text-xs h-11 px-5 shadow-sm"
            >
              <Printer className="size-4" />
              <span>Print Appointment Pass</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-xs h-11 px-5 hover:bg-muted/60"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=Lagos+University+Teaching+Hospital+LUTH+MedServe+Cancer+Centre`;
                window.open(url, "_blank");
              }}
            >
              <Navigation className="size-4 text-primary" />
              <span>Get Directions to Centre</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-9"
              onClick={onOpenReschedule}
            >
              <Calendar className="size-3.5 mr-1.5" />
              <span>Request Date or Time Change</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

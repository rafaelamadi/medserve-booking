"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import type { RegisteredPatient } from "@/entities/patient";
import type { PatientCareSchedule } from "@/entities/care-series";
import type { PatientVisit } from "@/shared/types";

export interface CareSeriesTimelineProps {
  patient: RegisteredPatient;
  schedule?: PatientCareSchedule;
}

export function CareSeriesTimeline({ patient, schedule }: CareSeriesTimelineProps) {
  const [viewMode, setViewMode] = React.useState<"matrix" | "list">("matrix");

  const totalSessions = patient.totalVisits || schedule?.totalVisits || 25;
  const completedSessions = patient.completedVisits || schedule?.completedVisits || 14;
  const remainingSessions = Math.max(0, totalSessions - completedSessions);
  const percentComplete = Math.round((completedSessions / totalSessions) * 100);

  const visits: PatientVisit[] = schedule?.visits || [];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-foreground">
                Treatment Course & Care Series
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/20">
                {schedule?.reference || "SCH-MLCC-084"}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              {schedule?.diagnosis || patient.primaryDiagnosis} · {schedule?.technique || "VMAT Multi-Fraction Protocol"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground font-medium">View:</span>
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "matrix"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar and milestone summary */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                {completedSessions} of {totalSessions} Sessions Delivered
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                ({remainingSessions} remaining)
              </span>
            </div>
            <span className="font-extrabold text-primary text-base tabular-nums">
              {percentComplete}% Complete
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/80 p-0.5 border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-primary to-teal-400 transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Started: <strong className="text-foreground">{schedule?.startDate || "05 Oct 2026"}</strong></span>
            <span>Est. Completion: <strong className="text-foreground">{schedule?.projectedEndDate || "06 Nov 2026"}</strong></span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "matrix" ? (
          /* Fraction Matrix View (Pills 1 to Total) */
          <div className="space-y-4">
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 gap-2 pt-1">
              {Array.from({ length: totalSessions }, (_, idx) => {
                const fractionNum = idx + 1;
                const isCompleted = fractionNum <= completedSessions;
                const isNext = fractionNum === completedSessions + 1;

                return (
                  <div
                    key={fractionNum}
                    className={`relative rounded-xl p-2 flex flex-col items-center justify-center border text-center transition-all ${
                      isCompleted
                        ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : isNext
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20 text-primary font-bold shadow-xs scale-105"
                          : "bg-muted/20 border-border/60 text-muted-foreground opacity-70"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider">
                      # {fractionNum}
                    </span>
                    <div className="my-1">
                      {isCompleted ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : isNext ? (
                        <span className="size-2 rounded-full bg-primary animate-ping block my-1" />
                      ) : (
                        <Clock className="size-3.5 text-muted-foreground/60" />
                      )}
                    </div>
                    <span className="text-[9px] font-medium leading-none">
                      {isCompleted ? "Delivered" : isNext ? "Next" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                Delivered Fraction
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary ring-2 ring-primary/30" />
                Next Immediate Visit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                Scheduled Future Session
              </span>
            </div>
          </div>
        ) : (
          /* Detailed Timeline List */
          <div className="max-h-[380px] overflow-y-auto divide-y rounded-xl border bg-card/60">
            {visits.length > 0 ? (
              visits.map((v) => {
                const isCompleted = v.status === "COMPLETED";
                const isNext = v.visitNumber === completedSessions + 1;

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                      isNext
                        ? "bg-primary/[0.04] font-medium border-l-4 border-l-primary"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-600"
                            : isNext
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {v.visitNumber}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {v.serviceName} #{v.visitNumber}
                          </span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {v.room}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {v.date} at {v.timeSlot}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        isCompleted
                          ? "default"
                          : isNext
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        isCompleted
                          ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]"
                          : isNext
                            ? "bg-primary/20 text-primary font-bold text-[10px]"
                            : "text-[10px]"
                      }
                    >
                      {isCompleted ? "Delivered" : isNext ? "Next Up" : "Scheduled"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Detailed fraction list will appear once your series schedule is finalized.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

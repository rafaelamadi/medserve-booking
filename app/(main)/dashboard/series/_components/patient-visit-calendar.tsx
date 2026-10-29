"use client";

import * as React from "react";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { PatientVisit } from "@/data/care-series-data";

interface PatientVisitCalendarProps {
  visits: PatientVisit[];
  patientName: string;
  onSelectVisit?: (visit: PatientVisit) => void;
}

// Known clinic public holidays (closed)
const PUBLIC_HOLIDAYS: Record<string, string> = {
  "2026-10-01": "National Day",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
  "2026-01-01": "New Year's Day",
};

export function PatientVisitCalendar({
  visits,
  patientName,
  onSelectVisit,
}: PatientVisitCalendarProps) {
  // Calendar month state
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    // Find the active scheduled/in-treatment visit or latest visit
    const active =
      visits.find((v) => v.status === "IN_TREATMENT" || v.status === "SCHEDULED") ??
      visits[0];
    if (active?.date) {
      const [y, m] = active.date.split("-").map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date(2026, 9, 1); // default Oct 2026
  });

  const [selectedVisit, setSelectedVisit] = React.useState<PatientVisit | null>(
    visits.find((v) => v.status === "IN_TREATMENT" || v.status === "SCHEDULED") ?? visits[0] ?? null,
  );

  // Auto-snap to active appointment month whenever visits or patient changes
  React.useEffect(() => {
    const active =
      visits.find((v) => v.status === "IN_TREATMENT" || v.status === "SCHEDULED") ??
      visits[visits.length - 1] ??
      visits[0];

    if (active?.date) {
      const [y, m] = active.date.split("-").map(Number);
      if (y && m) {
        setCurrentDate(new Date(y, m - 1, 1));
        setSelectedVisit(active);
      }
    }
  }, [visits]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create lookup map of visits by date string "YYYY-MM-DD"
  const visitsByDate = React.useMemo(() => {
    const map = new Map<string, PatientVisit[]>();
    for (const v of visits) {
      const arr = map.get(v.date) || [];
      arr.push(v);
      map.set(v.date, arr);
    }
    return map;
  }, [visits]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Calendar Header with Month Selector & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="size-4.5 text-primary" />
            Visit Schedule Calendar — {patientName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full treatment itinerary across weekdays. Click any scheduled day to view arrival time, clinical room, and service encounter.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/40 p-1 rounded-lg border">
          <Button variant="ghost" size="icon" className="size-8" onClick={handlePrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-semibold text-xs sm:text-sm min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Full-Width Month Calendar Grid */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs w-full overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground mb-3 pb-2 border-b">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Days Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Blank cells before start of month */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-[85px] sm:min-h-[105px] rounded-lg bg-muted/15 border border-dashed border-border/40 opacity-25"
            />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayVisits = visitsByDate.get(dateStr) || [];
            const isSelected = selectedVisit && dayVisits.some((v) => v.id === selectedVisit.id);
            const isWeekend = (firstDayIndex + i) % 7 === 0 || (firstDayIndex + i) % 7 === 6;
            const holidayName = PUBLIC_HOLIDAYS[dateStr];
            const isHoliday = Boolean(holidayName);

            // Determine primary visit status on this date
            const primaryVisit = dayVisits[0];
            const hasVisit = dayVisits.length > 0;
            const visitStatus = primaryVisit?.status;

            // Scenario styling
            let tileStyle = "";
            if (isWeekend || isHoliday) {
              // Faded and greyed out like as if it is faded
              tileStyle =
                "bg-muted/70 opacity-40 border-muted/70 text-muted-foreground/50 pointer-events-none select-none";
            } else if (!hasVisit) {
              // Free weekday: Left EXACTLY as it is currently in code (normal solid bordered card)
              tileStyle = "bg-card border-border";
            } else {
              // Day WITH an appointment: colored block based on scenario
              if (visitStatus === "COMPLETED") {
                tileStyle =
                  "bg-emerald-500/15 border-emerald-500/50 hover:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 shadow-2xs cursor-pointer";
              } else if (visitStatus === "IN_TREATMENT") {
                tileStyle =
                  "bg-amber-500/25 border-amber-500 ring-2 ring-amber-500/50 animate-pulse text-amber-950 dark:text-amber-100 shadow-xs cursor-pointer";
              } else if (visitStatus === "RESCHEDULED") {
                tileStyle =
                  "bg-rose-500/15 border-rose-500/50 hover:bg-rose-500/25 text-rose-950 dark:text-rose-100 shadow-2xs cursor-pointer";
              } else {
                // SCHEDULED / Yet to be done
                tileStyle =
                  "bg-blue-500/15 border-blue-500/50 hover:bg-blue-500/25 text-blue-950 dark:text-blue-100 shadow-2xs cursor-pointer";
              }
            }

            return (
              <div
                key={dateStr}
                className={cn(
                  "min-h-[85px] sm:min-h-[105px] p-2 rounded-lg border text-left transition-all relative flex flex-col justify-between",
                  tileStyle,
                  isSelected && "ring-2 ring-primary border-primary shadow-sm",
                )}
                onClick={() => {
                  if (hasVisit) {
                    setSelectedVisit(dayVisits[0]);
                    onSelectVisit?.(dayVisits[0]);
                  }
                }}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : hasVisit
                          ? "bg-background/80 text-foreground font-bold shadow-2xs"
                          : "text-foreground font-medium",
                      (isWeekend || isHoliday) && "text-muted-foreground/60 bg-transparent",
                    )}
                  >
                    {dayNum}
                  </span>

                  {hasVisit && (
                    <span className="text-[10px] text-muted-foreground font-mono font-medium hidden sm:inline">
                      Visit #{primaryVisit.visitNumber}
                    </span>
                  )}

                  {isHoliday && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground truncate max-w-[55px]">
                      {holidayName}
                    </span>
                  )}
                </div>

                {/* Visit Content Block */}
                {hasVisit && (
                  <div className="flex flex-col gap-1 mt-1">
                    {dayVisits.map((v) => (
                      <div
                        key={v.id}
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] leading-tight font-medium flex flex-col gap-0.5 border shadow-2xs",
                          v.status === "COMPLETED" &&
                            "bg-emerald-600/20 text-emerald-900 dark:text-emerald-100 border-emerald-600/30",
                          v.status === "IN_TREATMENT" &&
                            "bg-amber-600/30 text-amber-950 dark:text-amber-100 border-amber-600/50 font-bold",
                          v.status === "RESCHEDULED" &&
                            "bg-rose-600/20 text-rose-900 dark:text-rose-100 border-rose-600/30",
                          v.status === "SCHEDULED" &&
                            "bg-blue-600/20 text-blue-900 dark:text-blue-100 border-blue-600/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold flex items-center gap-1">
                            {v.status === "COMPLETED" && (
                              <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                            )}
                            {v.status === "IN_TREATMENT" && (
                              <Zap className="size-3 text-amber-600 shrink-0 animate-bounce" />
                            )}
                            {v.status === "SCHEDULED" && (
                              <Clock className="size-3 text-blue-600 shrink-0" />
                            )}
                            {v.status === "RESCHEDULED" && (
                              <AlertTriangle className="size-3 text-rose-600 shrink-0" />
                            )}
                            {v.timeSlot}
                          </span>
                        </div>
                        <span className="truncate text-[10px] opacity-90 font-medium">
                          {v.serviceName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weekend closed label */}
                {isWeekend && !isHoliday && (
                  <div className="text-[10px] text-muted-foreground/60 italic font-mono mt-auto">
                    Closed
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-500/40 border border-emerald-600" />
              <span className="font-medium text-foreground">Completed Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-500/40 border border-amber-600" />
              <span className="font-medium text-foreground">In Session (Today)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-blue-500/40 border border-blue-600" />
              <span className="font-medium text-foreground">Upcoming (Yet to Be Done)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-card border border-border" />
              <span>Free Weekdays (Open)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-muted/70 opacity-40 border border-muted" />
              <span>Weekends & Holidays (Faded)</span>
            </div>
          </div>

          <span className="text-[11px] text-muted-foreground font-medium">
            Total {visits.length} scheduled visits in course
          </span>
        </div>
      </div>

      {/* Selected Visit Details Panel */}
      {selectedVisit ? (
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3 border-primary/30 bg-primary/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                #{selectedVisit.visitNumber}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedVisit.serviceName} — Visit #{selectedVisit.visitNumber} of {visits.length}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Appointment scheduled for {patientName}
                </p>
              </div>
            </div>

            <Badge
              variant={
                selectedVisit.status === "COMPLETED"
                  ? "default"
                  : selectedVisit.status === "IN_TREATMENT"
                    ? "destructive"
                    : "outline"
              }
              className={
                selectedVisit.status === "COMPLETED"
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white text-xs"
                  : selectedVisit.status === "IN_TREATMENT"
                    ? "bg-amber-600 hover:bg-amber-600 text-white text-xs"
                    : "text-xs font-semibold"
              }
            >
              {selectedVisit.status === "COMPLETED"
                ? "Completed"
                : selectedVisit.status === "IN_TREATMENT"
                  ? "In Session"
                  : "Scheduled (Yet to be done)"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-lg border bg-background p-3 flex items-center gap-3">
              <CalendarIcon className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Scheduled Date</span>
                <span className="text-xs font-bold text-foreground">{selectedVisit.date}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-3 flex items-center gap-3">
              <Clock className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Daily Arrival Time</span>
                <span className="text-xs font-bold text-foreground">{selectedVisit.timeSlot}</span>
              </div>
            </div>

            {selectedVisit.room ? (
              <div className="rounded-lg border bg-background p-3 flex items-center gap-3">
                <MapPin className="size-4 text-primary shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Facility / Room</span>
                  <span className="text-xs font-bold text-foreground">{selectedVisit.room}</span>
                </div>
              </div>
            ) : null}
          </div>

          {selectedVisit.notes && (
            <div className="rounded-lg border bg-background p-3 text-xs flex items-start gap-2">
              <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground italic">{selectedVisit.notes}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Printer,
  Sparkles,
} from "lucide-react";

import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import type { PatientCareSchedule } from "@/entities/care-series";
import type { PatientVisit } from "@/shared/types";
import { usePatientPortalStore } from "@/entities/patient";

export interface TreatmentCalendarProps {
  schedule: PatientCareSchedule;
  onOpenPass?: (visit?: PatientVisit) => void;
}

export type CalendarViewMode = "month" | "week" | "day";

const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const YEARS = ["2025", "2026", "2027", "2028"];

export function TreatmentCalendar({ schedule, onOpenPass }: TreatmentCalendarProps) {
  // Calendar view mode: month | week | day
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("month");
  const { calendarFocusDate } = usePatientPortalStore();

  // Map of all visits grouped by date
  const visitsListByDate = React.useMemo(() => {
    const map = new Map<string, PatientVisit[]>();
    (schedule.visits || []).forEach((v) => {
      const list = map.get(v.date) || [];
      list.push(v);
      map.set(v.date, list);
    });
    return map;
  }, [schedule.visits]);

  // Primary visit by date string YYYY-MM-DD
  const visitsByDate = React.useMemo(() => {
    const map = new Map<string, PatientVisit>();
    (schedule.visits || []).forEach((v) => {
      if (!map.has(v.date) || v.status === "IN_TREATMENT" || v.visitNumber === 15) {
        map.set(v.date, v);
      }
    });
    return map;
  }, [schedule.visits]);

  // Default next upcoming visit
  const nextVisit = React.useMemo(() => {
    return (
      (schedule.visits || []).find((v) => v.status === "SCHEDULED" || v.status === "IN_TREATMENT") ||
      (schedule.visits && schedule.visits.length > 0 ? schedule.visits[0] : null)
    );
  }, [schedule.visits]);

  // Selected visit and active reference date
  const defaultDate = React.useMemo(() => {
    if (nextVisit?.date) {
      const [year, month, day] = nextVisit.date.split("-").map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
    return new Date();
  }, [nextVisit]);
  const [currentDate, setCurrentDate] = React.useState<Date>(defaultDate);
  const [selectedVisit, setSelectedVisit] = React.useState<PatientVisit | null>(nextVisit);

  // Sync selected date and navigate when a booking is confirmed
  React.useEffect(() => {
    if (calendarFocusDate) {
      const [year, month, day] = calendarFocusDate.split("-").map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const targetDate = new Date(year, month - 1, day);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize calendar view date with store focus
        setCurrentDate(targetDate);
        const match = (schedule.visits || []).find((v) => v.date === calendarFocusDate);
        if (match) {
          setSelectedVisit(match);
        }
      }
    }
  }, [calendarFocusDate, schedule.visits]);

  // Sync selected visit when clicking a date
  const handleSelectDate = (date: Date) => {
    setCurrentDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const visit = visitsByDate.get(dateStr) || null;
    setSelectedVisit(visit);
  };

  // Continuous Navigation handlers across all months / weeks / days
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((d) => subMonths(d, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => subDays(d, 7));
    } else {
      setCurrentDate((d) => subDays(d, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, 7));
    } else {
      setCurrentDate((d) => addDays(d, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(defaultDate);
    const dateStr = format(defaultDate, "yyyy-MM-dd");
    setSelectedVisit(visitsByDate.get(dateStr) || nextVisit);
  };

  const handleMonthChange = (monthStr: string) => {
    const newMonth = parseInt(monthStr, 10);
    const newDate = new Date(currentDate.getFullYear(), newMonth, Math.min(currentDate.getDate(), 28));
    setCurrentDate(newDate);
    const dateStr = format(newDate, "yyyy-MM-dd");
    setSelectedVisit(visitsByDate.get(dateStr) || null);
  };

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr, 10);
    const newDate = new Date(newYear, currentDate.getMonth(), Math.min(currentDate.getDate(), 28));
    setCurrentDate(newDate);
    const dateStr = format(newDate, "yyyy-MM-dd");
    setSelectedVisit(visitsByDate.get(dateStr) || null);
  };

  // Subtitle info for Week and Day view
  const subViewLabel = React.useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
    }
    if (viewMode === "day") {
      return format(currentDate, "EEEE, d MMMM yyyy");
    }
    return null;
  }, [viewMode, currentDate]);

  // Current month's visits count
  const currentMonthVisits = React.useMemo(() => {
    const prefix = format(currentDate, "yyyy-MM");
    return schedule.visits.filter((v) => v.date.startsWith(prefix));
  }, [schedule.visits, currentDate]);

  // Month grid calculation
  const calendarDays = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday-based index: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const days: Array<{
      dayNum: number;
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      dayOfWeek: number;
      visit?: PatientVisit;
      visits: PatientVisit[];
    }> = [];

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
      days.push({
        dayNum: 0,
        date: new Date(year, month, 1 - (startDayIndex - i)),
        dateStr: "",
        isCurrentMonth: false,
        dayOfWeek: i,
        visits: [],
      });
    }

    // Actual days of month
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const dayOfWeek = (startDayIndex + d - 1) % 7;
      const dateStr = format(cellDate, "yyyy-MM-dd");
      const visit = visitsByDate.get(dateStr);
      const visits = visitsListByDate.get(dateStr) || [];

      days.push({
        dayNum: d,
        date: cellDate,
        dateStr,
        isCurrentMonth: true,
        dayOfWeek,
        visit,
        visits,
      });
    }

    return days;
  }, [currentDate, visitsByDate, visitsListByDate]);

  // Week days calculation (Monday to Sunday)
  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const visit = visitsByDate.get(dateStr);
      return {
        date: d,
        dateStr,
        dayOfWeek: d.getDay(),
        visit,
      };
    });
  }, [currentDate, visitsByDate]);

  // Current day visit for Day view
  const currentDayStr = format(currentDate, "yyyy-MM-dd");
  const currentDayVisit = visitsByDate.get(currentDayStr);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-6">
      {/* 1. Calendar Header with Full Month & Year Selectors and View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        {/* Left: Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">Treatment Calendar</h3>
            {subViewLabel && (
              <Badge variant="secondary" className="text-xs font-mono font-medium">
                {subViewLabel}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your scheduled sessions, clinic visits, and appointment calendar.
          </p>
        </div>

        {/* Center / Right: Interactive Month & Year Picker + View Switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          {/* Stepper controls with Any-Month & Year Dropdowns */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-background"
              onClick={handlePrev}
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-semibold rounded-lg hover:bg-background"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-background"
              onClick={handleNext}
              title="Next"
            >
              <ChevronRight className="size-4" />
            </Button>

            {/* Month Dropdown (All 12 Months Available) */}
            <Select
              value={String(currentDate.getMonth())}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger
                size="sm"
                className="h-8 font-bold text-xs min-w-[115px] bg-background border-border/80 shadow-2xs"
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => {
                  const hasSessions = schedule.visits.some(
                    (v) =>
                      v.date.startsWith(
                        `${currentDate.getFullYear()}-${String(Number(m.value) + 1).padStart(2, "0")}`
                      )
                  );
                  return (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      <span className="flex items-center justify-between w-full gap-2">
                        <span>{m.label}</span>
                        {hasSessions && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Year Dropdown */}
            <Select
              value={String(currentDate.getFullYear())}
              onValueChange={handleYearChange}
            >
              <SelectTrigger
                size="sm"
                className="h-8 font-bold text-xs min-w-[75px] bg-background border-border/80 shadow-2xs"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y} className="text-xs font-mono">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Granularity Switcher: Month | Week | Day */}
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as CalendarViewMode)}
          >
            <TabsList size="lg" className="bg-muted/80 rounded-xl p-1 h-10">
              <TabsTrigger
                value="month"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="day"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
              >
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. VIEW: MONTH */}
      {viewMode === "month" && (
        <div className="space-y-4">
          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="py-1">Mon</span>
            <span className="py-1">Tue</span>
            <span className="py-1">Wed</span>
            <span className="py-1">Thu</span>
            <span className="py-1">Fri</span>
            <span className="py-1 text-muted-foreground/60">Sat</span>
            <span className="py-1 text-muted-foreground/60">Sun</span>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[82px] sm:min-h-[96px] rounded-xl border border-dashed border-border/30 bg-muted/10 opacity-30"
                  />
                );
              }

              const isWeekend = cell.dayOfWeek === 5 || cell.dayOfWeek === 6;
              const visit = cell.visit;
              const isCompleted = visit?.status === "COMPLETED";
              const isNext = visit?.status === "IN_TREATMENT" || visit?.visitNumber === 15;
              const isSelected = isSameDay(cell.date, currentDate);

              return (
                <button
                  type="button"
                  key={cell.dateStr}
                  onClick={() => handleSelectDate(cell.date)}
                  className={`min-h-[82px] sm:min-h-[96px] p-2 rounded-xl border text-left transition-all flex flex-col justify-between relative group ${
                    isNext
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs"
                      : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50"
                        : visit
                          ? "bg-card border-border/80 hover:border-primary/50 hover:bg-muted/20"
                          : isWeekend
                            ? "bg-muted/15 border-border/40 text-muted-foreground/50 cursor-default"
                            : "bg-background border-border/40 text-muted-foreground/70 cursor-default"
                  } ${isSelected ? "ring-2 ring-foreground/20" : ""}`}
                >
                  {/* Day Number and status indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isNext
                          ? "text-primary"
                          : isCompleted
                            ? "text-emerald-700 dark:text-emerald-400"
                            : isWeekend
                              ? "text-muted-foreground/50"
                              : "text-foreground"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {isNext && (
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>

                  {/* Chemotherapy / Appointment Badge */}
                  <div className="mt-1">
                    {cell.visits && cell.visits.length > 0 ? (
                      <div className="space-y-1">
                        {cell.visits.map((v) => {
                          const isVNext = v.status === "IN_TREATMENT" || v.visitNumber === 15;
                          const isVCompleted = v.status === "COMPLETED";
                          const label = v.visitNumber ? `Chemo #${v.visitNumber}` : v.serviceName;

                          return (
                            <div key={v.id} className="space-y-0.5">
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-full ${
                                  isVNext
                                    ? "bg-primary text-primary-foreground"
                                    : isVCompleted
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                                      : "bg-primary/10 text-primary border border-primary/25 font-semibold"
                                }`}
                              >
                                {label}
                              </span>
                              <span className="hidden sm:block text-[10px] text-muted-foreground font-mono">
                                {v.timeSlot}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : isWeekend ? (
                      <span className="text-[10px] text-muted-foreground/50 font-medium">
                        Rest Day
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">
                        No session
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VIEW: WEEK */}
      {viewMode === "week" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((item) => {
              const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;
              const visit = item.visit;
              const isCompleted = visit?.status === "COMPLETED";
              const isNext = visit?.status === "IN_TREATMENT" || visit?.visitNumber === 15;
              const isSelected = isSameDay(item.date, currentDate);

              return (
                <div
                  key={item.dateStr}
                  onClick={() => handleSelectDate(item.date)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between min-h-[170px] cursor-pointer transition-all ${
                    isNext
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs"
                      : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50"
                        : visit
                          ? "bg-card border-border hover:border-primary/40 hover:bg-muted/10"
                          : "bg-muted/15 border-border/40 text-muted-foreground/50"
                  } ${isSelected ? "ring-2 ring-foreground/20" : ""}`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <div>
                        <div className="text-[11px] font-bold text-muted-foreground uppercase">
                          {format(item.date, "EEE")}
                        </div>
                        <div className="text-base font-extrabold text-foreground">
                          {format(item.date, "d MMM")}
                        </div>
                      </div>
                      {isNext && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Next
                        </span>
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-2 space-y-1.5">
                      {visit ? (
                        <>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isNext
                                ? "bg-primary text-primary-foreground"
                                : isCompleted
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-primary/10 text-primary border border-primary/25"
                            }`}
                          >
                            {visit.visitNumber ? `Chemotherapy #${visit.visitNumber}` : visit.serviceName}
                          </Badge>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1 font-mono">
                            <Clock className="size-3 text-muted-foreground" />
                            {visit.timeSlot}
                          </div>
                          {visit.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 italic pt-0.5">
                              &ldquo;{visit.notes}&rdquo;
                            </p>
                          )}
                        </>
                      ) : isWeekend ? (
                        <div className="pt-3 text-xs text-muted-foreground/60 italic">
                          Weekend Rest Day
                        </div>
                      ) : (
                        <div className="pt-3 text-xs text-muted-foreground/40 italic">
                          No session
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action */}
                  {visit && onOpenPass && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 h-7 text-[11px] font-medium gap-1 text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPass(visit);
                      }}
                    >
                      <Printer className="size-3" />
                      Pass
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW: DAY */}
      {viewMode === "day" && (
        <div className="space-y-4">
          {currentDayVisit ? (
            <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {currentDayVisit.status === "IN_TREATMENT" || currentDayVisit.visitNumber === 15
                        ? "Next Confirmed Session"
                        : currentDayVisit.status === "COMPLETED"
                          ? "Delivered Session"
                          : "Scheduled Appointment"}
                    </span>
                    {currentDayVisit.visitNumber ? (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Chemotherapy #{currentDayVisit.visitNumber} of 25
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30">
                        Confirmed Appointment
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-extrabold text-foreground mt-1">
                    {format(currentDate, "EEEE, d MMMM yyyy")} at {currentDayVisit.timeSlot}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Service: <strong className="text-foreground">{currentDayVisit.serviceName}</strong> · Centre: <strong className="text-foreground">{schedule.centreName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild variant="outline" size="default" className="h-9 px-4 text-xs font-medium">
                    <Link href="/dashboard/portal/appointments">
                      Full Ledger
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Day Details / Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/10 text-xs">
                <div className="p-3.5 rounded-xl border bg-background/80 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    Session Schedule & Check-in
                  </div>
                  <p className="text-muted-foreground">
                    Scheduled arrival window: <strong>{currentDayVisit.timeSlot}</strong>. Please arrive 15 minutes prior for check-in and vitals verification.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-background/80 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    Clinical Notes & Status
                  </div>
                  <p className="text-muted-foreground">
                    {currentDayVisit.notes
                      ? `“${currentDayVisit.notes}”`
                      : "Standard protocol session. Tolerated well with ongoing monitoring."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed text-center space-y-3 bg-muted/10">
              <div className="size-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <Clock className="size-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  No Session on {format(currentDate, "EEEE, d MMMM yyyy")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  This day is scheduled as a rest or recovery day. No clinic attendance is required.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-medium"
                onClick={handleToday}
              >
                Jump to Next Scheduled Session (27 Oct)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 5. Selected Day Inspector Banner (Shown when in Month View) */}
      {viewMode === "month" && selectedVisit && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {selectedVisit.status === "IN_TREATMENT" || selectedVisit.visitNumber === 15
                  ? "Next Confirmed Visit"
                  : selectedVisit.status === "COMPLETED"
                    ? "Completed Session"
                    : "Scheduled Appointment"}
              </span>
              {selectedVisit.visitNumber ? (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Chemotherapy #{selectedVisit.visitNumber} of 25
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30">
                  Confirmed Appointment
                </Badge>
              )}
            </div>
            <div className="text-sm font-extrabold text-foreground">
              {selectedVisit.date} at {selectedVisit.timeSlot} · {selectedVisit.serviceName}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span>Centre: {schedule.centreName}</span>
              {selectedVisit.notes && (
                <>
                  <span>·</span>
                  <span className="italic text-foreground/80">&ldquo;{selectedVisit.notes}&rdquo;</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setViewMode("day")}
            >
              Day View
            </Button>
          </div>
        </div>
      )}

      {/* 6. Calendar Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            Completed Sessions ({(schedule.visits || []).filter((v) => v.status === "COMPLETED").length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary ring-2 ring-primary/30" />
            Scheduled Sessions ({(schedule.visits || []).filter((v) => v.status === "SCHEDULED" || v.status === "IN_TREATMENT").length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted/40" />
            Rest Day (Sat & Sun)
          </span>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          {schedule.technique || "Clinical Care Calendar"}
        </span>
      </div>
    </div>
  );
}

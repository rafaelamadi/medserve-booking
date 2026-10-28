"use client";

import * as React from "react";
import {
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Phone,
  Printer,
  Repeat,
  Share2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PatientCareSchedule, PatientVisit } from "@/data/care-series-data";

import { PatientVisitCalendar } from "./patient-visit-calendar";

interface SeriesDetailSheetProps {
  series: PatientCareSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSeries?: (updated: PatientCareSchedule) => void;
}

export function SeriesDetailSheet({
  series,
  open,
  onOpenChange,
  onUpdateSeries,
}: SeriesDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<"calendar" | "list" | "reschedule">("calendar");

  // State for shifting visits
  const [shiftFromDate, setShiftFromDate] = React.useState("");
  const [shiftDays, setShiftDays] = React.useState(1);
  const [shiftReason, setShiftReason] = React.useState("Patient travel delay");

  React.useEffect(() => {
    if (series) {
      const nextVisit = series.visits.find((v) => v.status === "SCHEDULED");
      if (nextVisit) {
        setShiftFromDate(nextVisit.date);
      } else {
        setShiftFromDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [series]);

  if (!series) return null;

  const percentComplete =
    series.totalVisits > 0
      ? Math.round((series.completedVisits / series.totalVisits) * 100)
      : 0;

  // Handle marking a visit complete
  const handleMarkVisitComplete = (visitNumber: number) => {
    const updatedVisits = series.visits.map((v) => {
      if (v.visitNumber === visitNumber) {
        return {
          ...v,
          status: "COMPLETED" as const,
        };
      }
      return v;
    });

    const newCompleted = updatedVisits.filter((v) => v.status === "COMPLETED").length;
    const newRemaining = Math.max(0, series.totalVisits - newCompleted);

    const updated: PatientCareSchedule = {
      ...series,
      completedVisits: newCompleted,
      remainingVisits: newRemaining,
      status: newRemaining === 0 ? "COMPLETED" : series.status,
      visits: updatedVisits,
    };

    onUpdateSeries?.(updated);
    toast.success(`Visit #${visitNumber} Completed`, {
      description: `${series.patientName} completed ${series.primaryService}.`,
    });
  };

  // Handle shifting schedule forward (pure logic skipping Sat/Sun)
  const handleShiftSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shiftFromDate || shiftDays <= 0) {
      toast.error("Please provide a valid date and days to advance.");
      return;
    }

    const updatedVisits = series.visits.map((v) => {
      if (v.date >= shiftFromDate && v.status === "SCHEDULED") {
        const parts = v.date.split("-").map(Number);
        const curr = new Date(parts[0], parts[1] - 1, parts[2]);

        let added = 0;
        while (added < shiftDays) {
          curr.setDate(curr.getDate() + 1);
          const day = curr.getDay();
          if (day !== 0 && day !== 6) {
            added++;
          }
        }

        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const dd = String(curr.getDate()).padStart(2, "0");
        const newDate = `${yyyy}-${mm}-${dd}`;

        return {
          ...v,
          rescheduledFrom: v.date,
          date: newDate,
        };
      }
      return v;
    });

    const updated: PatientCareSchedule = {
      ...series,
      hasRescheduleRequest: false,
      rescheduleNotice: undefined,
      visits: updatedVisits,
    };

    onUpdateSeries?.(updated);
    // [SMS notification commented out; using Email via Resend]
    toast.success("Visits Rescheduled", {
      description: `Future visits advanced by +${shiftDays} working days. Patient notified via Email.`,
    });
    setActiveTab("calendar");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[92vw] md:w-[88vw] lg:w-[82vw] xl:w-[78vw] max-w-[1360px] overflow-y-auto p-0 flex flex-col gap-0 border-l bg-background shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                {series.reference}
              </span>
              <Badge
                variant={
                  series.status === "COMPLETED"
                    ? "default"
                    : series.status === "ACTIVE"
                      ? "outline"
                      : "secondary"
                }
                className={
                  series.status === "COMPLETED"
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "border-primary text-primary"
                }
              >
                {series.status}
              </Badge>
              {series.hasRescheduleRequest && (
                <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                  <AlertCircle className="size-3" />
                  Reschedule Requested
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  window.print();
                  toast.success("Printing Patient Visit Itinerary");
                }}
              >
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print Itinerary</span>
              </Button>
            </div>
          </div>

          <div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {series.patientName}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>MRN: <strong className="text-foreground font-mono">{series.patientMrn}</strong></span>
              <span>Phone: <strong className="text-foreground">{series.patientPhone}</strong></span>
              <span>Centre: <strong className="text-foreground">{series.centreCode}</strong></span>
            </SheetDescription>
          </div>

          {/* Reschedule Alert Notice */}
          {series.hasRescheduleRequest && series.rescheduleNotice && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold text-amber-900 dark:text-amber-200">Patient Reschedule Request</span>
                <p className="text-muted-foreground">{series.rescheduleNotice}</p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-500/40 text-amber-800 dark:text-amber-200"
                    onClick={() => setActiveTab("reschedule")}
                  >
                    Adjust Schedule Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Schedule Summary Banner */}
        <div className="p-4 border-b bg-muted/15 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Service Encounter & Room</span>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{series.primaryService}</span>
              <span className="text-muted-foreground font-normal">·</span>
              <span className="text-xs font-semibold text-muted-foreground">{series.room}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-xs text-muted-foreground">Visit Progress</span>
              <div className="text-sm font-bold tabular-nums text-foreground">
                {series.completedVisits} of {series.totalVisits} completed
              </div>
            </div>
            <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden hidden sm:block">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col p-5 space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="calendar" className="text-xs flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              Visit Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs flex items-center gap-1.5">
              <FileText className="size-3.5" />
              All Visits ({series.visits.length})
            </TabsTrigger>
            <TabsTrigger value="reschedule" className="text-xs flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              Reschedule / Move Dates
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CALENDAR VIEW */}
          <TabsContent value="calendar" className="mt-0 space-y-4">
            <PatientVisitCalendar
              visits={series.visits}
              patientName={series.patientName}
            />
          </TabsContent>

          {/* TAB 2: VISIT ITINERARY LIST */}
          <TabsContent value="list" className="mt-0 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Chronological list of all scheduled visits for this patient</span>
              <span className="font-mono font-medium">{series.completedVisits} / {series.totalVisits} Done</span>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto divide-y">
                {series.visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md font-mono font-bold text-xs bg-muted border">
                        #{v.visitNumber}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{v.date}</span>
                          <span className="text-muted-foreground font-medium">{v.timeSlot}</span>
                          {v.rescheduledFrom && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 text-muted-foreground">
                              Moved from {v.rescheduledFrom}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {v.serviceName} · <span className="font-medium">{v.room}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          v.status === "COMPLETED"
                            ? "default"
                            : v.status === "IN_TREATMENT"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          v.status === "COMPLETED"
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]"
                            : v.status === "IN_TREATMENT"
                              ? "bg-amber-600 hover:bg-amber-600 text-white text-[11px]"
                              : "text-[11px]"
                        }
                      >
                        {v.status}
                      </Badge>

                      {v.status === "SCHEDULED" && v.visitNumber && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleMarkVisitComplete(v.visitNumber!)}
                        >
                          Check In & Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: RESCHEDULE / MOVE DATES */}
          <TabsContent value="reschedule" className="mt-0 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <Repeat className="size-4 text-primary" />
                Shift Upcoming Visits (Advance Schedule)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a patient is unable to attend or needs to shift their visits due to travel or personal conflict,
                push all remaining sessions forward by $N$ working days. Weekends are automatically skipped so the patient
                remains on their regular weekday schedule.
              </p>
            </div>

            <form onSubmit={handleShiftSchedule} className="space-y-4 rounded-lg border p-4 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="shiftFromDate" className="text-xs">
                    Shift Starting From Date:
                  </Label>
                  <Input
                    id="shiftFromDate"
                    type="date"
                    value={shiftFromDate}
                    onChange={(e) => setShiftFromDate(e.target.value)}
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Only sessions on or after this date will move.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shiftDays" className="text-xs">
                    Working Days to Push Forward:
                  </Label>
                  <Input
                    id="shiftDays"
                    type="number"
                    min={1}
                    max={14}
                    value={shiftDays}
                    onChange={(e) => setShiftDays(Number(e.target.value))}
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">
                    e.g. 1 day, 2 days, or 5 days (1 full week).
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shiftReason" className="text-xs">
                  Reason for Moving Date:
                </Label>
                <Input
                  id="shiftReason"
                  value={shiftReason}
                  onChange={(e) => setShiftReason(e.target.value)}
                  placeholder="e.g. Patient travel delay, personal emergency, clinic maintenance"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="gap-2">
                  <CalendarClock className="size-4" />
                  Save & Update Patient Calendar
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <SheetFooter className="p-4 border-t bg-muted/20 flex flex-row justify-between items-center sm:justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {series.doctorInCharge} · {series.pattern}
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close Drawer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

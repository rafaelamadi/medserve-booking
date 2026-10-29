"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Home,
  Phone,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import {
  PATIENT_SCHEDULES,
  type PatientCareSchedule,
  type PatientVisit,
} from "@/entities/care-series";
import { usePatientPortalStore, type RegisteredPatient } from "@/entities/patient";
import { TreatmentCalendar } from "@/widgets/treatment-calendar";
import { PatientBookingDialog } from "@/features/book-appointment";
import type { PublicBookingRecord } from "@/entities/appointment";

function ManageAppointmentsContent({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  const { patient, customVisits, setPatient } = usePatientPortalStore();
  const [viewMode, setViewMode] = React.useState<"LEDGER" | "CALENDAR">("LEDGER");
  const [filter, setFilter] = React.useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");
  const [slipOpen, setSlipOpen] = React.useState(false);
  const [selectedVisitForSlip, setSelectedVisitForSlip] = React.useState<PatientVisit | null>(null);

  React.useEffect(() => {
    if (initialPatient && (!patient || patient.id !== initialPatient.id || patient.fullName === "Chidinma Nwosu")) {
      setPatient(initialPatient);
    }
  }, [initialPatient, patient, setPatient]);

  const activePatient = initialPatient || patient;

  // Booking dialog state
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [extraVisits, setExtraVisits] = React.useState<PatientVisit[]>([]);

  // Cancel dialog state
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [visitToCancel, setVisitToCancel] = React.useState<PatientVisit | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isCancelling, setIsCancelling] = React.useState(false);

  const baseSchedule: PatientCareSchedule | null = React.useMemo(() => {
    return (
      PATIENT_SCHEDULES.find(
        (s) =>
          s.patientId === activePatient.id ||
          s.patientMrn === activePatient.mrn ||
          s.reference === activePatient.scheduleRef,
      ) || null
    );
  }, [activePatient]);

  const schedule: PatientCareSchedule = React.useMemo(() => {
    return {
      id: baseSchedule?.id || `sched-${activePatient.id || "new"}`,
      reference: baseSchedule?.reference || `SER-${activePatient.mrn || "CARE"}`,
      patientId: activePatient.id || "",
      patientMrn: activePatient.mrn || "",
      patientName: activePatient.fullName || "",
      patientPhone: activePatient.phone || "",
      centreCode: (activePatient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
      centreName: activePatient.centreName || "MedServe Care Centre",
      primaryService: baseSchedule?.primaryService || activePatient.primaryService || "Clinical Consultation",
      technique: baseSchedule?.technique || "Clinical Consultation & Care",
      diagnosis: baseSchedule?.diagnosis || "Specialist Care",
      room: baseSchedule?.room || "",
      doctorInCharge: baseSchedule?.doctorInCharge || "Clinical Care Team",
      totalVisits: baseSchedule?.totalVisits || 0,
      completedVisits: baseSchedule?.completedVisits || 0,
      remainingVisits: baseSchedule?.remainingVisits || 0,
      nextVisitDate: baseSchedule?.nextVisitDate || "",
      nextVisitTime: baseSchedule?.nextVisitTime || "",
      pattern: baseSchedule?.pattern || "CUSTOM_DATES",
      startDate: baseSchedule?.startDate || "",
      projectedEndDate: baseSchedule?.projectedEndDate || "",
      status: baseSchedule?.status || "ACTIVE",
      hasRescheduleRequest: false,
      visits: baseSchedule?.visits || [],
    };
  }, [baseSchedule, activePatient]);

  // Merge past encounters + future chemotherapy visits + extra user bookings into 1 cohesive schedule
  const mergedSchedule: PatientCareSchedule = React.useMemo(() => {
    const combinedExtra = [...customVisits, ...extraVisits];
    const existingIds = new Set(schedule.visits.map((v) => v.id));
    const uniqueExtra = combinedExtra.filter((v) => !existingIds.has(v.id));
    return {
      ...schedule,
      visits: [...schedule.visits, ...uniqueExtra].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [schedule, customVisits, extraVisits]);

  const allVisits = React.useMemo(() => {
    return mergedSchedule.visits;
  }, [mergedSchedule.visits]);

  const hasAppointments = allVisits.length > 0;
  const totalSessions = allVisits.length;
  const completedSessions = allVisits.filter((v) => v.status === "COMPLETED").length;
  const percentComplete = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const nextVisit = React.useMemo(() => {
    if (!hasAppointments) return null;
    const upcoming = allVisits.find((v) => v.status === "SCHEDULED" || v.status === "IN_TREATMENT") || allVisits[0];
    if (!upcoming) return null;
    return {
      date: upcoming.date,
      timeSlot: upcoming.timeSlot,
      service: upcoming.serviceName || activePatient.primaryService || "Clinical Session",
      room: schedule.room || "",
      visitNumber: upcoming.visitNumber,
    };
  }, [hasAppointments, allVisits, schedule.room, activePatient.primaryService]);

  const filteredVisits = React.useMemo(() => {
    if (filter === "UPCOMING") {
      return allVisits.filter((v) => v.status === "SCHEDULED" || v.status === "IN_TREATMENT");
    }
    if (filter === "COMPLETED") {
      return allVisits.filter((v) => v.status === "COMPLETED");
    }
    return allVisits;
  }, [allVisits, filter]);

  const handleOpenSlip = (visit?: PatientVisit) => {
    setSelectedVisitForSlip(visit || null);
    setSlipOpen(true);
  };

  const handleOpenCancel = (visit: PatientVisit) => {
    setVisitToCancel(visit);
    setCancelReason("");
    setCancelOpen(true);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      setCancelOpen(false);
      toast.success("Cancellation Submitted", {
        description: `Your request to cancel Chemotherapy #${visitToCancel?.visitNumber} on ${visitToCancel?.date} has been logged. Our clinical coordinator will follow up.`,
      });
    }, 600);
  };

  return (
    <div className="@container/main flex flex-col gap-6 max-w-6xl mx-auto w-full py-2">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Link href="/dashboard/portal" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="size-3.5" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Manage Appointments</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Manage Appointments
          </h1>
          <p className="text-sm text-muted-foreground">
            Combined schedule of your active treatment series, upcoming chemotherapy sessions, and past encounter history for {patient.fullName}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="default"
            className="h-10 px-4 gap-2 font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setBookingOpen(true)}
          >
            <CalendarPlus className="size-4" />
            Book Appointment
          </Button>
          <Button asChild variant="outline" size="default" className="h-10 px-3.5 gap-2 text-sm font-medium">
            <a href="tel:+23418880300">
              <Phone className="size-4 text-emerald-600 dark:text-emerald-400" />
              Helpline
            </a>
          </Button>
        </div>
      </div>

      {/* Immediate Next Session & Progress Summary Strip */}
      {hasAppointments && nextVisit ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Next Session Card */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  Next Confirmed Session
                </span>
                <h2 className="text-2xl font-extrabold text-foreground mt-0.5">
                  {nextVisit.date} at {nextVisit.timeSlot}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Session #{nextVisit.visitNumber || 1} of {totalSessions} · {nextVisit.service}
                </p>
              </div>

              <Button
                size="default"
                className="h-9 px-4 gap-2 text-xs font-semibold shadow-xs shrink-0 self-start sm:self-auto"
                onClick={() => handleOpenSlip()}
              >
                <Printer className="size-3.5" />
                Print Pass
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
              <Clock className="size-3.5 text-primary" />
              <span>Centre: {schedule.centreName}. Arrive 15 mins prior for check-in and vitals verification.</span>
            </div>
          </div>

          {/* Progress Card */}
          <div className="p-5 rounded-2xl border bg-card space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-foreground">Course Completion</span>
                <span className="font-extrabold text-primary tabular-nums text-sm">{percentComplete}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Delivered Sessions:</span>
                <strong className="text-foreground font-semibold">{completedSessions} of {totalSessions}</strong>
              </div>
              <div className="flex justify-between">
                <span>Remaining Sessions:</span>
                <strong className="text-foreground font-semibold">{totalSessions - completedSessions}</strong>
              </div>
              <div className="flex justify-between">
                <span>Target End Date:</span>
                <strong className="text-foreground font-semibold">{schedule.projectedEndDate || "—"}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-border/80 bg-card text-center space-y-3">
          <div className="mx-auto size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <CalendarPlus className="size-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-foreground">No Confirmed Sessions</h2>
            <p className="text-xs text-muted-foreground">
              You do not have any appointments scheduled yet. Click below to book a session or consultation at your preferred centre.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 px-4 gap-2 text-xs font-semibold shadow-xs"
            onClick={() => setBookingOpen(true)}
          >
            <CalendarPlus className="size-3.5" />
            Book Your First Appointment
          </Button>
        </div>
      )}

      {/* Merged Appointments & History Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {viewMode === "LEDGER"
                ? `All Visits & Encounters (${allVisits.length})`
                : "Treatment Calendar Grid"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {viewMode === "LEDGER"
                ? "Chronological ledger merging completed clinical attendance and future scheduled appointments."
                : "Interactive month-by-month calendar view with chemotherapy session status and allocations."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(val) => setViewMode(val as "LEDGER" | "CALENDAR")}
            >
              <TabsList size="lg" className="bg-muted/80 rounded-xl p-1 h-11">
                <TabsTrigger
                  value="LEDGER"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
                >
                  Ledger List
                </TabsTrigger>
                <TabsTrigger
                  value="CALENDAR"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
                >
                  Calendar View
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Tabs when in Ledger Mode */}
            {viewMode === "LEDGER" && (
              <Tabs
                value={filter}
                onValueChange={(val) => setFilter(val as "ALL" | "UPCOMING" | "COMPLETED")}
              >
                <TabsList size="lg" className="bg-muted/80 rounded-xl p-1 h-11">
                  <TabsTrigger
                    value="ALL"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
                  >
                    All ({allVisits.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="UPCOMING"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
                  >
                    Upcoming ({totalSessions - completedSessions})
                  </TabsTrigger>
                  <TabsTrigger
                    value="COMPLETED"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-active:bg-background data-active:shadow-xs"
                  >
                    Delivered ({completedSessions})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === "CALENDAR" ? (
          <TreatmentCalendar
            schedule={mergedSchedule}
            onOpenPass={(visit) => handleOpenSlip(visit)}
          />
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border bg-card overflow-hidden">
            {filteredVisits.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CalendarPlus className="size-8 mx-auto text-muted-foreground/60" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">No Appointments Recorded</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    You do not have any appointments in this view. Book your first appointment to populate your care ledger.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold"
                  onClick={() => setBookingOpen(true)}
                >
                  <CalendarPlus className="size-3.5" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              filteredVisits.map((visit) => {
              const isCompleted = visit.status === "COMPLETED";
              const isNext = visit.status === "IN_TREATMENT" || visit.visitNumber === 15;

              return (
                <div
                  key={visit.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors ${
                    isNext ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : isNext
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="size-5" /> : `#${visit.visitNumber}`}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          Chemotherapy #{visit.visitNumber}: {visit.serviceName}
                        </span>
                        {isNext && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Next Session
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Delivered & Verified
                          </span>
                        )}
                        {!isCompleted && !isNext && (
                          <span className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span>Centre: {schedule.centreName}</span>
                        {visit.notes && (
                          <>
                            <span>·</span>
                            <span className="italic text-foreground/80">&ldquo;{visit.notes}&rdquo;</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono shrink-0 pl-13 sm:pl-0">
                    <div className="sm:text-right">
                      <span className="font-semibold text-foreground block">
                        {visit.date}
                      </span>
                      <span className="text-muted-foreground">
                        {visit.timeSlot}
                      </span>
                    </div>

                    {isNext ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSlip(visit)}
                        className="h-8 gap-1.5 text-xs shrink-0"
                      >
                        <Printer className="size-3" />
                        Pass
                      </Button>
                    ) : !isCompleted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenCancel(visit)}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive shrink-0"
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            }))}
          </div>
        )}
      </div>

      {/* Cancellation Dialog (24h cutoff notice) */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-base">
              <AlertCircle className="size-5" />
              Cancel Appointment Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please note that chemotherapy sessions require careful scheduling with your oncology team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCancel} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border bg-muted/30 text-xs space-y-1 font-mono">
              <div><strong>Session:</strong> Chemotherapy #{visitToCancel?.visitNumber} ({visitToCancel?.serviceName})</div>
              <div><strong>Date & Time:</strong> {visitToCancel?.date} at {visitToCancel?.timeSlot}</div>
              <div><strong>Centre:</strong> {schedule.centreName}</div>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <ShieldAlert className="size-4 shrink-0" />
                24-Hour Notice Policy
              </div>
              Cancellations submitted within 24 hours of your slot require verbal confirmation by calling the clinic helpline at <strong>+234 (01) 888 0300</strong> to reschedule your linear accelerator time safely.
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cancel-reason" className="text-xs font-medium text-foreground">
                Reason for cancellation
              </label>
              <textarea
                id="cancel-reason"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please briefly describe why you need to cancel this appointment..."
                className="w-full text-xs p-2.5 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none min-h-[75px]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancelOpen(false)}>
                Keep Appointment
              </Button>
              <Button type="submit" variant="destructive" size="sm" disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Appointment Pass Dialog */}
      <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border">
          <div className="p-6 space-y-4 bg-card">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-foreground">
                    MedServe Oncology Network
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {patient.centreName}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-50/50">
                OFFICIAL PASS
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Patient Name
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  {patient.fullName}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Medical Record Number
                </span>
                <span className="font-mono font-bold text-foreground">{patient.mrn}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-muted-foreground">Session:</span>
                <span className="font-semibold text-foreground">
                  Session #{selectedVisitForSlip?.visitNumber || nextVisit?.visitNumber || 1} · {selectedVisitForSlip?.serviceName || nextVisit?.service || "Clinical Consultation"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold text-foreground">
                  {selectedVisitForSlip?.date || nextVisit?.date || "—"} at {selectedVisitForSlip?.timeSlot || nextVisit?.timeSlot || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Care Team:</span>
                <span className="font-semibold text-foreground">Clinical Oncology Team</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-dashed text-center font-mono text-xs tracking-widest text-muted-foreground bg-muted/10">
              ||| | |||| | |||||| || | |||| |||
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setSlipOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="size-3.5" />
              Print Pass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In-Place Patient Booking Overlay Dialog */}
      <PatientBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        patient={patient}
        defaultCentreCode={(patient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC"}
        onBookingSuccess={(bkg: PublicBookingRecord) => {
          const newVisit: PatientVisit = {
            id: `vis-bkg-${Date.now()}`,
            visitNumber: (schedule.visits?.length || 0) + extraVisits.length + 1,
            date: bkg.date,
            timeSlot: bkg.timeSlot,
            serviceName: bkg.serviceName,
            room: "",
            status: "SCHEDULED",
            notes: bkg.notes || `Self-booked appointment (${bkg.reference})`,
          };
          setExtraVisits((prev) => [newVisit, ...prev]);
        }}
      />
    </div>
  );
}

export function PortalAppointmentsPage({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-sm text-muted-foreground">
          Loading appointments...
        </div>
      }
    >
      <ManageAppointmentsContent initialPatient={initialPatient} />
    </React.Suspense>
  );
}

export default PortalAppointmentsPage;

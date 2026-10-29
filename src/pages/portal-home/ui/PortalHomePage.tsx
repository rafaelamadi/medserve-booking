"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  CalendarPlus,
  Clock,
  Mail,
  MapPin,
  Phone,
  Printer,
} from "lucide-react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/shared/ui";
import {
  PATIENT_SCHEDULES,
  type PatientCareSchedule,
  type PatientVisit,
  type VisitStatus,
} from "@/entities/care-series";
import { usePatientPortalStore, type RegisteredPatient } from "@/entities/patient";
import { TreatmentCalendar } from "@/widgets/treatment-calendar";
import { PatientBookingDialog } from "@/features/book-appointment";

export function PatientHomeContent({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  const { patient, customVisits, setPatient } = usePatientPortalStore();
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [slipOpen, setSlipOpen] = React.useState(false);
  const [selectedVisitForSlip, setSelectedVisitForSlip] = React.useState<PatientVisit | null>(null);

  React.useEffect(() => {
    if (initialPatient && (!patient || patient.id !== initialPatient.id || patient.fullName === "Chidinma Nwosu")) {
      setPatient(initialPatient);
    }
  }, [initialPatient, patient, setPatient]);

  const activePatient = initialPatient || patient;

  // Only find matching pre-existing schedule if patient is a demo patient (e.g. pat-01), otherwise null
  const baseSchedule: PatientCareSchedule | null = React.useMemo(() => {
    return (
      PATIENT_SCHEDULES.find(
        (s) =>
          s.patientId === activePatient.id ||
          s.patientMrn === activePatient.mrn,
      ) || null
    );
  }, [activePatient]);

  // Live visits from Supabase via getLivePatientById
  const liveVisits: PatientVisit[] = React.useMemo(() => {
    if (!activePatient.visits || activePatient.visits.length === 0) return [];
    return activePatient.visits.map((v, idx) => ({
      id: v.id,
      visitNumber: idx + 1,
      date: v.date,
      timeSlot: v.timeSlot,
      serviceName: v.serviceName,
      room: v.room,
      status: (v.status === "COMPLETED"
        ? "COMPLETED"
        : v.status === "IN_TREATMENT" || v.status === "CHECKED_IN"
        ? "IN_TREATMENT"
        : v.status === "NO_SHOW"
        ? "MISSED"
        : "SCHEDULED") as VisitStatus,
      notes: v.notes,
    }));
  }, [activePatient.visits]);

  const schedule: PatientCareSchedule = React.useMemo(() => {
    const existingIds = new Set<string>();
    const allCombined: PatientVisit[] = [];

    // 1. Add real Supabase visits (primary source of truth)
    for (const v of liveVisits) {
      if (!existingIds.has(v.id)) {
        existingIds.add(v.id);
        allCombined.push(v);
      }
    }

    // 2. Add demo schedule visits only if this is a known demo patient
    if (baseSchedule?.visits) {
      for (const v of baseSchedule.visits) {
        if (!existingIds.has(v.id)) {
          existingIds.add(v.id);
          allCombined.push(v);
        }
      }
    }

    // 3. Add any optimistic custom visits from the active session
    if (customVisits) {
      for (const v of customVisits) {
        if (!existingIds.has(v.id)) {
          existingIds.add(v.id);
          allCombined.push(v);
        }
      }
    }

    const visits = allCombined.sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: baseSchedule?.id || `sched-${activePatient.id || "new"}`,
      reference: baseSchedule?.reference || `SER-${activePatient.mrn || "CARE"}`,
      patientId: activePatient.id || "",
      patientMrn: activePatient.mrn || "",
      patientName: activePatient.fullName || "",
      patientPhone: activePatient.phone || "",
      centreCode: (activePatient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
      centreName: activePatient.centreName || "MedServe Care Centre",
      primaryService:
        baseSchedule?.primaryService ||
        visits.find((v) => v.status === "SCHEDULED")?.serviceName ||
        visits[0]?.serviceName ||
        activePatient.primaryService ||
        "Clinical Consultation",
      technique: baseSchedule?.technique || "Clinical Consultation & Care",
      diagnosis: baseSchedule?.diagnosis || "Specialist Care",
      room: baseSchedule?.room || "",
      doctorInCharge: baseSchedule?.doctorInCharge || "Clinical Care Team",
      totalVisits: baseSchedule?.totalVisits || (visits.length > 0 ? visits.length : 0),
      completedVisits: baseSchedule?.completedVisits || 0,
      remainingVisits: Math.max(0, (visits.length > 0 ? visits.length : 0) - (baseSchedule?.completedVisits || 0)),
      nextVisitDate: visits.find((v) => v.status === "SCHEDULED")?.date || visits[0]?.date || "",
      nextVisitTime: visits.find((v) => v.status === "SCHEDULED")?.timeSlot || visits[0]?.timeSlot || "",
      pattern: baseSchedule?.pattern || "CUSTOM_DATES",
      startDate: baseSchedule?.startDate || visits[0]?.date || "",
      projectedEndDate: baseSchedule?.projectedEndDate || visits[visits.length - 1]?.date || "",
      status: baseSchedule?.status || "ACTIVE",
      hasRescheduleRequest: false,
      visits,
    };
  }, [baseSchedule, customVisits, activePatient]);

  const hasAppointments = schedule.visits.length > 0;

  const nextVisit = React.useMemo(() => {
    if (!hasAppointments) return null;
    const upcoming = schedule.visits.find((v) => v.status === "SCHEDULED" || v.status === "IN_TREATMENT") || schedule.visits[0];
    if (!upcoming) return null;
    return {
      date: upcoming.date,
      timeSlot: upcoming.timeSlot,
      service: upcoming.serviceName || activePatient.primaryService || "Clinical Session",
      room: schedule.room || "",
      visitNumber: upcoming.visitNumber,
    };
  }, [hasAppointments, schedule.visits, schedule.room, activePatient.primaryService]);

  return (
    <div className="@container/main flex flex-col gap-8 max-w-6xl mx-auto w-full py-2">
      {/* 1. Patient Profile Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border/60">
        <div className="space-y-3">
          {/* Patient Name & MRN */}
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {activePatient.fullName}
            </h1>
            <span className="font-mono text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
              {activePatient.mrn}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Active Care
            </span>
          </div>

          {/* Demographic & Contact Details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{activePatient.gender || "Gender Unspecified"}, {activePatient.age ? `${activePatient.age} yrs` : "Age Unspecified"}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Phone className="size-3.5 text-muted-foreground" />
              {activePatient.phone || "No phone added"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              {activePatient.email}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              {activePatient.address ? `${activePatient.address}, ` : ""}{activePatient.state || "Nigeria"}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons: Book Appointment + Single Pass Button (Disabled when no bookings) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            size="default"
            className="h-10 px-4 gap-2 font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setBookingOpen(true)}
          >
            <CalendarPlus className="size-4" />
            Book Appointment
          </Button>

          <Button
            variant="outline"
            size="default"
            disabled={!hasAppointments}
            className={`h-10 px-3.5 gap-2 text-sm font-medium transition-opacity ${
              !hasAppointments ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
            }`}
            onClick={() => {
              if (hasAppointments) setSlipOpen(true);
            }}
            title={!hasAppointments ? "Book an appointment to enable pass printing" : "Print Appointment Pass"}
          >
            <Printer className="size-4" />
            Print Pass
          </Button>
        </div>
      </div>

      {/* 2. Next Scheduled Session Highlight OR Clean Empty State for New Patients */}
      {hasAppointments && nextVisit ? (
        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Next Scheduled Session
              </span>
              <h2 className="text-2xl font-extrabold text-foreground mt-0.5">
                {nextVisit.date} at {nextVisit.timeSlot}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Session #{nextVisit.visitNumber || 1} · {nextVisit.service}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                size="default"
                className="h-9 px-4 gap-2 text-xs font-semibold shadow-xs"
                onClick={() => setBookingOpen(true)}
              >
                <CalendarPlus className="size-3.5" />
                Book Another
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <Clock className="size-3.5 text-primary" />
            <span>Centre: {schedule.centreName}. Please arrive 15 minutes prior for check-in and vitals verification.</span>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-border/80 bg-card text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <CalendarPlus className="size-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-lg font-bold text-foreground">No Upcoming Appointments</h2>
            <p className="text-sm text-muted-foreground">
              You do not have any scheduled appointments yet. Book a session or clinic consultation at your preferred MedServe centre.
            </p>
          </div>
          <div>
            <Button
              type="button"
              size="default"
              className="h-10 px-5 gap-2 font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setBookingOpen(true)}
            >
              <CalendarPlus className="size-4" />
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* 3. Interactive Treatment Calendar */}
      <TreatmentCalendar
        schedule={schedule}
        onOpenPass={(visit) => {
          setSelectedVisitForSlip(visit || null);
          setSlipOpen(true);
        }}
      />

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
                    {activePatient.centreName || "MedServe Care Centre"}
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
                  {activePatient.fullName}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Medical Record Number
                </span>
                <span className="font-mono font-bold text-foreground">{activePatient.mrn}</span>
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
        patient={activePatient}
        defaultCentreCode={(activePatient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC"}
      />
    </div>
  );
}

export function PortalHomePage({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-sm text-muted-foreground">
          Loading home...
        </div>
      }
    >
      <PatientHomeContent initialPatient={initialPatient} />
    </React.Suspense>
  );
}

export default PortalHomePage;

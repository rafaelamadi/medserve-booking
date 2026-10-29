"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Mail,
  MapPin,
  Phone,
  Printer,
  Stethoscope,
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

  const baseSchedule: PatientCareSchedule = React.useMemo(() => {
    return (
      PATIENT_SCHEDULES.find(
        (s) =>
          s.patientId === activePatient.id ||
          s.patientMrn === activePatient.mrn ||
          s.reference === activePatient.scheduleRef,
      ) || PATIENT_SCHEDULES[0]
    );
  }, [activePatient]);

  const schedule: PatientCareSchedule = React.useMemo(() => {
    if (!customVisits || customVisits.length === 0) return baseSchedule;
    const existingIds = new Set(baseSchedule.visits.map((v) => v.id));
    const extra = customVisits.filter((v) => !existingIds.has(v.id));
    return {
      ...baseSchedule,
      visits: [...baseSchedule.visits, ...extra].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [baseSchedule, customVisits]);

  const totalSessions = activePatient.totalVisits || schedule.totalVisits || 25;

  const nextVisit = activePatient.nextVisit || {
    date: schedule.nextVisitDate || "2026-10-27",
    timeSlot: schedule.nextVisitTime || "08:30 AM",
    service: schedule.primaryService || activePatient.primaryService || "Radiotherapy Session",
    room: schedule.room || "",
  };

  return (
    <div className="@container/main flex flex-col gap-8 max-w-6xl mx-auto w-full py-2">
      {/* 1. Open, Immediate Patient Header */}
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

        {/* Primary Action Buttons */}
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

          <Button asChild variant="outline" size="default" className="h-10 px-4 gap-2 font-medium">
            <Link href="/dashboard/portal/appointments">
              <CalendarCheck className="size-4" />
              Manage Appointments
            </Link>
          </Button>

          <Button
            variant="outline"
            size="default"
            className="h-10 px-3.5 gap-2 text-sm font-medium"
            onClick={() => setSlipOpen(true)}
          >
            <Printer className="size-4" />
            Print Pass
          </Button>

          <Button asChild size="default" className="h-10 px-3.5 gap-2 text-sm font-medium" variant="outline">
            <a href="tel:+23418880300">
              <Phone className="size-4 text-emerald-600 dark:text-emerald-400" />
              Centre Helpline
            </a>
          </Button>
        </div>
      </div>

      {/* 2. Next Scheduled Session Highlight */}
      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Next Scheduled Session
            </span>
            <h2 className="text-2xl font-extrabold text-foreground mt-0.5">
              {nextVisit.date === "2026-10-27" ? "Tomorrow, 27 October 2026" : nextVisit.date} at {nextVisit.timeSlot}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chemotherapy #15 of {totalSessions} · {nextVisit.service}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              size="default"
              className="h-9 px-4 gap-2 text-xs font-semibold shadow-xs"
              onClick={() => setSlipOpen(true)}
            >
              <Printer className="size-3.5" />
              Print Pass
            </Button>
            <Button
              asChild
              variant="outline"
              size="default"
              className="h-9 px-4 gap-2 text-xs font-medium"
            >
              <Link href="/dashboard/portal/appointments">
                <CalendarCheck className="size-3.5 text-primary" />
                View Full Schedule
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
          <Clock className="size-3.5 text-primary" />
          <span>Centre: {schedule.centreName}. Please arrive 15 minutes prior for check-in and vitals verification.</span>
        </div>
      </div>

      {/* 3. Interactive Treatment Calendar Form */}
      <TreatmentCalendar
        schedule={schedule}
        onOpenPass={(visit) => {
          setSelectedVisitForSlip(visit || null);
          setSlipOpen(true);
        }}
      />

      {/* 4. Quick Access Grid: Manage Appointments & Care Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Appointments Card */}
        <div className="p-6 rounded-2xl border bg-card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarCheck className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Manage Appointments</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access your full multi-week treatment calendar, view verified encounter history and clinical notes, or book an appointment.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button asChild size="default" className="flex-1 gap-2 text-xs font-semibold h-9">
              <Link href="/dashboard/portal/appointments">
                <CalendarCheck className="size-4" />
                Manage Appointments
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              className="gap-1.5 text-xs font-semibold h-9"
              onClick={() => setBookingOpen(true)}
            >
              <CalendarPlus className="size-3.5" />
              Book
            </Button>
          </div>
        </div>

        {/* Care Team & Helpline Card */}
        <div className="p-6 rounded-2xl border bg-card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Stethoscope className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Care Team & Support</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Centre: <strong className="text-foreground">{patient.centreName}</strong></p>
              <p>Care Team: <strong className="text-foreground">Clinical Oncology & Nursing Team</strong></p>
              <p>Hotline: <strong className="text-foreground font-mono">+234 (01) 888 0300</strong> (Mon - Fri, 8am - 5pm)</p>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button asChild variant="outline" size="default" className="flex-1 gap-2 text-xs font-medium h-9">
              <a href="tel:+23418880300">
                <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Call Desk
              </a>
            </Button>
            <Button asChild variant="outline" size="default" className="flex-1 gap-2 text-xs font-medium h-9">
              <a href="https://wa.me/23418880300" target="_blank" rel="noopener noreferrer">
                WhatsApp Desk
              </a>
            </Button>
          </div>
        </div>
      </div>

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
                  Chemotherapy #{selectedVisitForSlip?.visitNumber || 15} · {selectedVisitForSlip?.serviceName || nextVisit.service}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold text-foreground">
                  {selectedVisitForSlip?.date || nextVisit.date} at {selectedVisitForSlip?.timeSlot || nextVisit.timeSlot}
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

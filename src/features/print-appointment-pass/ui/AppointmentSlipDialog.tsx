"use client";

import * as React from "react";
import {
  Activity,
  Calendar,
  Clock,
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
import type { RegisteredPatient } from "@/entities/patient";
import type { PatientCareSchedule } from "@/entities/care-series";

export interface AppointmentSlipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: RegisteredPatient;
  schedule?: PatientCareSchedule;
}

export function AppointmentSlipDialog({
  open,
  onOpenChange,
  patient,
  schedule,
}: AppointmentSlipDialogProps) {
  const nextVisit = patient.nextVisit || {
    date: schedule?.nextVisitDate || "2026-10-27",
    timeSlot: schedule?.nextVisitTime || "08:30 AM",
    service: schedule?.primaryService || patient.primaryService || "Radiotherapy Session",
    room: schedule?.room || "",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border">
        {/* Printable Pass Container */}
        <div id="printable-appointment-pass" className="p-6 space-y-5 bg-card">
          {/* Header Strip */}
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
              VERIFIED PASS
            </Badge>
          </div>

          {/* Patient Details Strip */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Patient Name
              </span>
              <h4 className="text-base font-bold text-foreground">
                {patient.fullName}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {patient.gender}, {patient.age} years · {patient.phone}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Record No. (MRN)
              </span>
              <span className="font-mono text-sm font-bold text-primary block">
                {patient.mrn}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {patient.centreCode}
              </span>
            </div>
          </div>

          {/* Session Details Box */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5 text-primary" />
                  <span className="font-semibold text-[11px]">Appointment Date</span>
                </div>
                <div className="font-bold text-foreground text-sm">
                  {nextVisit.date}
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5 text-primary" />
                  <span className="font-semibold text-[11px]">Treatment Slot</span>
                </div>
                <div className="font-bold text-foreground text-sm">
                  {nextVisit.timeSlot}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Check-in: 08:15 AM
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Stethoscope className="size-3.5 text-primary" />
                <span className="font-semibold text-[11px]">Procedure & Facility</span>
              </div>
              <div className="font-bold text-foreground">
                {nextVisit.service}{nextVisit.room ? ` · ${nextVisit.room}` : ""}
              </div>
              <div className="text-muted-foreground text-[11px]">
                Attending Clinician: <strong className="text-foreground">{patient.doctorInCharge}</strong>
              </div>
            </div>
          </div>

          {/* Barcode Mock & Check-in instructions */}
          <div className="p-3 rounded-xl border border-dashed text-center space-y-1.5 bg-muted/10">
            <div className="font-mono text-xs tracking-widest font-bold text-muted-foreground">
              ||| | |||| | |||||| || | |||| |||
            </div>
            <p className="text-[11px] text-muted-foreground">
              Present this pass or state <strong className="font-mono text-foreground">{patient.mrn}</strong> at the reception desk.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="size-3.5" />
            Print Pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

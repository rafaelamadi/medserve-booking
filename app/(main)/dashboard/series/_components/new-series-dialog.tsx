"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Plus, Repeat, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientCareSchedule, PatientVisit, SchedulePattern } from "@/data/care-series-data";

interface NewSeriesDialogProps {
  onCreated: (newSchedule: PatientCareSchedule) => void;
}

export function NewSeriesDialog({ onCreated }: NewSeriesDialogProps) {
  const [open, setOpen] = React.useState(false);

  // Form states
  const [patientName, setPatientName] = React.useState("");
  const [patientMrn, setPatientMrn] = React.useState("");
  const [patientPhone, setPatientPhone] = React.useState("");
  const [centreCode, setCentreCode] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");
  const [primaryService, setPrimaryService] = React.useState("Radiotherapy Session");
  const [technique, setTechnique] = React.useState("VMAT Protocol");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [room, setRoom] = React.useState("Linac Vault 1");
  const [doctorInCharge, setDoctorInCharge] = React.useState("Dr. Kachi");
  const [totalVisits, setTotalVisits] = React.useState(20);
  const [pattern, setPattern] = React.useState<SchedulePattern>("DAILY_WORKING_DAYS");
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [dailyTime, setDailyTime] = React.useState("08:30");

  // Generate sessions preview (pure logic skipping Sat/Sun)
  const previewVisits = React.useMemo(() => {
    if (!startDate || totalVisits <= 0) return [];

    const result: PatientVisit[] = [];
    const parts = startDate.split("-").map(Number);
    const curr = new Date(parts[0], parts[1] - 1, parts[2]);

    while (result.length < totalVisits) {
      const day = curr.getDay(); // 0 = Sun, 6 = Sat
      if (pattern === "DAILY_WORKING_DAYS") {
        if (day !== 0 && day !== 6) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, "0");
          const dd = String(curr.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}-${mm}-${dd}`;

          result.push({
            id: `new-vis-${result.length + 1}`,
            visitNumber: result.length + 1,
            date: dateStr,
            timeSlot: `${dailyTime} AM`,
            serviceName: primaryService,
            room,
            status: "SCHEDULED",
          });
        }
      } else {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const dd = String(curr.getDate()).padStart(2, "0");
        result.push({
          id: `new-vis-${result.length + 1}`,
          visitNumber: result.length + 1,
          date: `${yyyy}-${mm}-${dd}`,
          timeSlot: `${dailyTime} AM`,
          serviceName: primaryService,
          room,
          status: "SCHEDULED",
        });
      }
      curr.setDate(curr.getDate() + 1);
    }
    return result;
  }, [startDate, totalVisits, pattern, dailyTime, primaryService, room]);

  const projectedEndDate = previewVisits[previewVisits.length - 1]?.date || startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      toast.error("Please enter patient name.");
      return;
    }

    const centreMap = {
      MLCC: "MedServe LUTH Cancer Centre (Lagos)",
      MKDC: "MedServe Kano Diagnostic & Oncology Centre",
      MUDC: "MedServe Abuja Diagnostics & Oncology",
    };

    const newId = `cs-${Date.now().toString().slice(-4)}`;
    const newRef = `SCH-${centreCode}-${Math.floor(100 + Math.random() * 900)}`;

    const newSchedule: PatientCareSchedule = {
      id: newId,
      reference: newRef,
      patientId: `pat-${Date.now().toString().slice(-4)}`,
      patientName,
      patientMrn: patientMrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      patientPhone: patientPhone || "+234 800 000 0000",
      centreCode,
      centreName: centreMap[centreCode],
      primaryService,
      technique,
      diagnosis: diagnosis || "Oncology Treatment Course",
      room,
      doctorInCharge,
      totalVisits,
      completedVisits: 0,
      remainingVisits: totalVisits,
      nextVisitDate: startDate,
      nextVisitTime: `${dailyTime} AM`,
      pattern,
      startDate,
      projectedEndDate,
      status: "ACTIVE",
      hasRescheduleRequest: false,
      visits: previewVisits,
    };

    onCreated(newSchedule);
    setOpen(false);
    toast.success("Patient Visit Schedule Created", {
      description: `${newRef} scheduled with ${totalVisits} visits at ${centreCode}.`,
    });

    // Reset form
    setPatientName("");
    setPatientMrn("");
    setPatientPhone("");
    setDiagnosis("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-medium">
          <Plus className="size-4" />
          <span>New Patient Schedule</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Schedule Patient Visits & Multi-Day Course
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate an automated visit calendar across weekdays with assigned clinical service and room.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Patient Details */}
          <div className="rounded-lg border p-3.5 bg-muted/20 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Patient Identification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Patient Full Name *</Label>
                <Input
                  placeholder="e.g. Halima Bello"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">MRN Number</Label>
                <Input
                  placeholder="e.g. MRN-1050"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="+234 803 ..."
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Service & Centre Encounter */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Centre & Service Encounter
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Centre *</Label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                  value={centreCode}
                  onChange={(e) => {
                    const c = e.target.value as "MLCC" | "MKDC" | "MUDC";
                    setCentreCode(c);
                    if (c === "MLCC") {
                      setRoom("Linac Vault 1");
                      setDoctorInCharge("Dr. Kachi");
                    } else if (c === "MKDC") {
                      setRoom("Linac Vault 1");
                      setDoctorInCharge("Dr. Amina Bello");
                    } else {
                      setRoom("Varian Halcyon Vault");
                      setDoctorInCharge("Dr. Chukwudi");
                    }
                  }}
                >
                  <option value="MLCC">MLCC — Lagos</option>
                  <option value="MKDC">MKDC — Kano</option>
                  <option value="MUDC">MUDC — Abuja</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Service Encounter</Label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                  value={primaryService}
                  onChange={(e) => setPrimaryService(e.target.value)}
                >
                  <option value="Radiotherapy Session">Radiotherapy Session</option>
                  <option value="Chemotherapy Infusion">Chemotherapy Infusion</option>
                  <option value="CT Simulation Scan">CT Simulation Scan</option>
                  <option value="Oncologist Consultation">Oncologist Consultation</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Treatment Room / Bay</Label>
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Clinical Condition / Diagnosis</Label>
                <Input
                  placeholder="e.g. Breast Cancer (Post-Surgery)"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Doctor in Charge</Label>
                <Input
                  value={doctorInCharge}
                  onChange={(e) => setDoctorInCharge(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Visits & Schedule Pattern */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Schedule & Visits Cadence
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Total Planned Visits</Label>
                <Input
                  type="number"
                  min={1}
                  max={45}
                  value={totalVisits}
                  onChange={(e) => setTotalVisits(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Daily Arrival Time</Label>
                <Input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs">Cadence Rule</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                value={pattern}
                onChange={(e) => setPattern(e.target.value as SchedulePattern)}
              >
                <option value="DAILY_WORKING_DAYS">Monday through Friday (Weekends Skipped)</option>
                <option value="EVERY_N_DAYS">Every 2 or 3 Days</option>
                <option value="EVERY_N_WEEKS">Every 2 or 3 Weeks (Chemotherapy)</option>
              </select>
            </div>
          </div>

          {/* Automated Schedule Preview */}
          <div className="rounded-lg border p-3.5 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <Sparkles className="size-3.5" />
                Generated Visit Schedule Preview
              </span>
              <span className="text-muted-foreground font-normal">
                {previewVisits.length} appointments created
              </span>
            </div>

            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>First Visit: <strong className="text-foreground">{startDate} at {dailyTime} AM</strong></span>
              <span>Final Visit: <strong className="text-foreground">{projectedEndDate}</strong></span>
              <span>Cadence: <strong className="text-foreground">Saturdays & Sundays skipped</strong></span>
            </div>

            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto py-1">
              {previewVisits.slice(0, 6).map((v) => (
                <Badge key={v.id} variant="outline" className="text-[10px] shrink-0 font-mono">
                  Visit #{v.visitNumber}: {v.date.slice(5)}
                </Badge>
              ))}
              {previewVisits.length > 6 && (
                <span className="text-xs text-muted-foreground px-1">...</span>
              )}
              {previewVisits.length > 6 && (
                <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                  Visit #{previewVisits[previewVisits.length - 1].visitNumber}:{" "}
                  {previewVisits[previewVisits.length - 1].date.slice(5)}
                </Badge>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <CalendarIcon className="size-4" />
              Generate Patient Calendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

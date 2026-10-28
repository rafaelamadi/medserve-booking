"use client";

import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClinicalAppointment } from "@/data/clinical-queue-data";

interface NewAppointmentDialogProps {
  onCreated?: (apt: ClinicalAppointment) => void;
}

export function NewAppointmentDialog({ onCreated }: NewAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("+234 ");
  const [patientMrn, setPatientMrn] = useState("");
  const [centreCode, setCentreCode] = useState<"MLCC" | "MKDC" | "MUDC">("MLCC");
  const [modality, setModality] = useState<"Radiotherapy" | "Chemotherapy" | "Consultation" | "Imaging">("Radiotherapy");
  const [serviceName, setServiceName] = useState("Radiotherapy (VMAT)");
  const [date, setDate] = useState("2026-10-26");
  const [timeSlot, setTimeSlot] = useState("02:00 PM");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const newRef = `${centreCode}-2610-${Math.floor(100 + Math.random() * 900)}`;
      const newMrn = patientMrn.trim() ? patientMrn.trim() : `MRN-${Math.floor(1000 + Math.random() * 9000)}`;

      const newApt: ClinicalAppointment = {
        id: `apt-${Date.now()}`,
        reference: newRef,
        patientName,
        patientPhone,
        patientMrn: newMrn,
        centreId: centreCode === "MLCC" ? "centre-mlcc" : centreCode === "MKDC" ? "centre-mkdc" : "centre-mudc",
        centreCode,
        centreName:
          centreCode === "MLCC"
            ? "MedServe LUTH Cancer Centre"
            : centreCode === "MKDC"
            ? "Kano Diagnostic Centre"
            : "Umuahia Diagnostic Centre",
        serviceName,
        modality,
        scheduledTime: `${date}T14:00:00Z`,
        timeSlot,
        durationMinutes: modality === "Chemotherapy" ? 120 : 30,
        room: centreCode === "MLCC" ? "Linac Vault 1" : centreCode === "MKDC" ? "Linac Suite A" : "Linac Suite 1",
        status: "CONFIRMED",
        oncologist: "Dr. Kachi",
        diagnosis: notes || "Newly Booked Clinical Consultation & Care Plan",
        dateCategory: "today",
      };

      onCreated?.(newApt);
      setLoading(false);
      setOpen(false);

      toast.success("Appointment Scheduled Successfully", {
        description: `Reference: ${newRef} for ${patientName} at ${centreCode}.`,
      });

      // Reset
      setPatientName("");
      setPatientMrn("");
      setNotes("");
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 text-xs">
          <CalendarPlus className="size-3.5 mr-1.5" />
          New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Book Clinical Appointment</DialogTitle>
          <DialogDescription className="text-xs">
            Schedule an oncology appointment or treatment session across MedServe network centres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="patient-name" className="text-xs font-medium">Patient Full Name</Label>
              <Input
                id="patient-name"
                placeholder="e.g. Dr. Aminu Kano"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-phone" className="text-xs font-medium">Phone Number</Label>
              <Input
                id="patient-phone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-mrn" className="text-xs font-medium">Medical Record No. (MRN)</Label>
              <Input
                id="patient-mrn"
                placeholder="e.g. MRN-2041"
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cancer Centre</Label>
              <Select
                value={centreCode}
                onValueChange={(v) => setCentreCode(v as "MLCC" | "MKDC" | "MUDC")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Centre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MLCC" className="text-xs">MLCC (Lagos)</SelectItem>
                  <SelectItem value="MKDC" className="text-xs">MKDC (Kano)</SelectItem>
                  <SelectItem value="MUDC" className="text-xs">MUDC (Abuja)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Treatment Modality</Label>
              <Select
                value={modality}
                onValueChange={(v) => {
                  const m = v as typeof modality;
                  setModality(m);
                  if (m === "Radiotherapy") setServiceName("Radiotherapy (VMAT)");
                  else if (m === "Chemotherapy") setServiceName("Chemotherapy Infusion");
                  else if (m === "Consultation") setServiceName("Oncology Consultation");
                  else setServiceName("CT Simulation & Planning");
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Radiotherapy" className="text-xs">Radiotherapy</SelectItem>
                  <SelectItem value="Chemotherapy" className="text-xs">Chemotherapy</SelectItem>
                  <SelectItem value="Consultation" className="text-xs">Consultation</SelectItem>
                  <SelectItem value="Imaging" className="text-xs">CT Simulation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apt-date" className="text-xs font-medium">Date</Label>
              <Input
                id="apt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apt-time" className="text-xs font-medium">Time Slot</Label>
              <Input
                id="apt-time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="02:00 PM"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clinical-notes" className="text-xs font-medium">Diagnosis / Clinical Notes</Label>
            <Input
              id="clinical-notes"
              placeholder="e.g. Adjuvant radiotherapy planning review"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8.5 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="h-8.5 text-xs">
              {loading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

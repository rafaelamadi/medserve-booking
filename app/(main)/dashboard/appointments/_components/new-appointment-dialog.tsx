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
import { CANONICAL_CENTRES_WITH_SERVICES, CANONICAL_STAFF } from "@/types/centre-scope";
import type { ClinicalAppointment } from "@/data/clinical-queue-data";

interface NewAppointmentDialogProps {
  onCreated?: (apt: ClinicalAppointment) => void;
  trigger?: React.ReactNode;
}

export function NewAppointmentDialog({ onCreated, trigger }: NewAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("+234 ");
  const [patientMrn, setPatientMrn] = useState("");
  const [centreCode, setCentreCode] = useState<"MLCC" | "MKDC" | "MUDC">("MLCC");

  const currentCentre =
    CANONICAL_CENTRES_WITH_SERVICES.find((c) => c.code === centreCode) || CANONICAL_CENTRES_WITH_SERVICES[0];

  const [serviceName, setServiceName] = useState("Radiotherapy");
  const [date, setDate] = useState("2026-10-26");
  const [timeSlot, setTimeSlot] = useState("02:00 PM");
  const [notes, setNotes] = useState("");

  const handleCentreChange = (code: "MLCC" | "MKDC" | "MUDC") => {
    setCentreCode(code);
    const targetCentre = CANONICAL_CENTRES_WITH_SERVICES.find((c) => c.code === code);
    if (targetCentre && targetCentre.services.length > 0) {
      setServiceName(targetCentre.services[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const newRef = `${centreCode}-2610-${Math.floor(100 + Math.random() * 900)}`;
      const newMrn = patientMrn.trim() ? patientMrn.trim() : `MRN-${Math.floor(1000 + Math.random() * 9000)}`;

      const targetService = currentCentre.services.find((s) => s.name === serviceName);
      const isChemo = serviceName.toLowerCase().includes("chemo");

      const newApt: ClinicalAppointment = {
        id: `apt-${Date.now()}`,
        reference: newRef,
        patientName,
        patientPhone,
        patientMrn: newMrn,
        centreId: currentCentre.id as "centre-mlcc" | "centre-mkdc" | "centre-mudc",
        centreCode: currentCentre.code,
        centreName: currentCentre.name,
        serviceName,
        modality: targetService?.category === "ONCOLOGY" ? "Radiotherapy" : "Consultation",
        scheduledTime: `${date}T14:00:00Z`,
        timeSlot,
        durationMinutes: 30,
        room: "",
        status: "CONFIRMED",
        oncologist: CANONICAL_STAFF.find((s) => s.centreCodes.includes(currentCentre.code))?.name || "Attending Clinician",
        diagnosis: notes || "Consultation & Care Plan",
        dateCategory: "today",
      };

      onCreated?.(newApt);
      setLoading(false);
      setOpen(false);

      toast.success("Appointment Booked Successfully", {
        description: `Reference: ${newRef} for ${patientName} at ${currentCentre.name}.`,
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
        {trigger || (
          <Button size="sm" className="h-9 text-xs">
            <CalendarPlus className="size-3.5 mr-1.5" />
            + Book Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Book Appointment</DialogTitle>
          <DialogDescription className="text-xs">
            Schedule a patient visit across MLCC (Lagos), MKDC (Kano), or MUDC (Umuahia).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="patient-name" className="text-xs font-medium">Patient Full Name</Label>
              <Input
                id="patient-name"
                placeholder="e.g. Babatunde Adeleke"
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
                placeholder="Optional (e.g. MRN-2041)"
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Select Centre</Label>
              <Select
                value={centreCode}
                onValueChange={(v) => handleCentreChange(v as "MLCC" | "MKDC" | "MUDC")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Centre" />
                </SelectTrigger>
                <SelectContent>
                  {CANONICAL_CENTRES_WITH_SERVICES.map((c) => (
                    <SelectItem key={c.id} value={c.code} className="text-xs">
                      {c.code} ({c.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {centreCode === "MLCC" ? "Oncology Service" : "Diagnostic Service"}
              </Label>
              <Select
                value={serviceName}
                onValueChange={(val) => setServiceName(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {currentCentre.services.map((s) => (
                    <SelectItem key={s.id} value={s.name} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
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
            <Label htmlFor="clinical-notes" className="text-xs font-medium">Notes / Reason (Optional)</Label>
            <Input
              id="clinical-notes"
              placeholder="e.g. Routine check-up or first-time consult"
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
              Book Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

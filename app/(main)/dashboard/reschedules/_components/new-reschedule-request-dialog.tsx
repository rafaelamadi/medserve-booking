"use client";

import * as React from "react";
import { Plus, UserCheck } from "lucide-react";
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
import type { RescheduleRequest } from "@/data/reschedules-data";

interface NewRescheduleRequestDialogProps {
  onCreated: (newReq: RescheduleRequest) => void;
}

export function NewRescheduleRequestDialog({
  onCreated,
}: NewRescheduleRequestDialogProps) {
  const [open, setOpen] = React.useState(false);

  // Form states
  const [patientName, setPatientName] = React.useState("");
  const [mrn, setMrn] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [centreCode, setCentreCode] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");
  const [currentDate, setCurrentDate] = React.useState("");
  const [currentTimeSlot, setCurrentTimeSlot] = React.useState("09:00 AM");
  const [requestedDate, setRequestedDate] = React.useState("");
  const [requestedTimeSlot, setRequestedTimeSlot] = React.useState("11:00 AM");
  const [requestedBy, setRequestedBy] = React.useState<"PATIENT" | "CLINICIAN" | "SYSTEM_EQUIPMENT">("PATIENT");
  const [urgency, setUrgency] = React.useState<"ROUTINE" | "URGENT" | "CRITICAL_BREAK">("ROUTINE");
  const [reason, setReason] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim() || !requestedDate) {
      toast.error("Please fill in patient name and requested date.");
      return;
    }

    const centreMap = {
      MLCC: "MedServe LUTH Cancer Centre (Lagos)",
      MKDC: "Kano Diagnostic & Oncology Centre",
      MUDC: "Abuja Diagnostic & Radiotherapy Centre",
    };

    const newReq: RescheduleRequest = {
      id: `req-${Date.now()}`,
      reference: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: `pat-custom`,
      patientName,
      mrn: mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: phone || "+234 800 000 0000",
      centreCode,
      centreName: centreMap[centreCode],
      serviceName: "Radiotherapy Session",
      room: centreCode === "MLCC" ? "Linac Vault 1" : "Linac Vault 2",
      currentDate: currentDate || new Date().toISOString().slice(0, 10),
      currentTimeSlot,
      requestedDate,
      requestedTimeSlot,
      requestedBy,
      reason: reason || "Patient requested appointment time adjustment.",
      urgency,
      status: "PENDING",
      isBulkSeries: true,
      remainingVisitsCount: 5,
      createdAt: "Just now",
    };

    onCreated(newReq);
    toast.success("Reschedule Request Logged", {
      description: `Request ${newReq.reference} for ${patientName} queued for triage review.`,
    });

    setOpen(false);
    setPatientName("");
    setMrn("");
    setPhone("");
    setReason("");
    setRequestedDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 text-xs">
          <Plus className="size-3.5" />
          Log Reschedule Request
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Patient / Clinician Reschedule Request</DialogTitle>
          <DialogDescription className="text-xs">
            Queue an incoming slot adjustment for clinical triage review and conflict checking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="req-name" className="text-xs">Patient Full Name *</Label>
              <Input
                id="req-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Chidinma Nwosu"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="req-mrn" className="text-xs">Patient Ref Number (MRN)</Label>
              <Input
                id="req-mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                placeholder="e.g. MRN-0941"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="req-phone" className="text-xs">Patient Phone</Label>
              <Input
                id="req-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 80..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="req-centre" className="text-xs">Facility Centre</Label>
              <Select
                value={centreCode}
                onValueChange={(val: "MLCC" | "MKDC" | "MUDC") => setCentreCode(val)}
              >
                <SelectTrigger id="req-centre">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
                  <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
                  <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="curr-date" className="text-xs text-muted-foreground">Current Appointment Date</Label>
              <Input
                id="curr-date"
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="curr-time" className="text-xs text-muted-foreground">Current Time</Label>
              <Input
                id="curr-time"
                value={currentTimeSlot}
                onChange={(e) => setCurrentTimeSlot(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-primary/[0.03] rounded-lg border border-primary/20">
            <div className="space-y-1">
              <Label htmlFor="req-date" className="text-xs font-semibold text-primary">Requested New Date *</Label>
              <Input
                id="req-date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="req-time" className="text-xs font-semibold text-primary">Requested Time</Label>
              <Input
                id="req-time"
                value={requestedTimeSlot}
                onChange={(e) => setRequestedTimeSlot(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="req-by" className="text-xs">Requested By</Label>
              <Select
                value={requestedBy}
                onValueChange={(val: "PATIENT" | "CLINICIAN" | "SYSTEM_EQUIPMENT") => setRequestedBy(val)}
              >
                <SelectTrigger id="req-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">Patient Initiated</SelectItem>
                  <SelectItem value="CLINICIAN">Clinician / Doctor Memo</SelectItem>
                  <SelectItem value="SYSTEM_EQUIPMENT">Machine QA / Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="req-urg" className="text-xs">Triage Urgency</Label>
              <Select
                value={urgency}
                onValueChange={(val: "ROUTINE" | "URGENT" | "CRITICAL_BREAK") => setUrgency(val)}
              >
                <SelectTrigger id="req-urg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine Adjustment</SelectItem>
                  <SelectItem value="URGENT">Urgent (Same-Day / Tomorrow)</SelectItem>
                  <SelectItem value="CRITICAL_BREAK">Critical Treatment Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="req-reason" className="text-xs">Clinical or Operational Reason</Label>
            <Input
              id="req-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Patient travel delay from Ibadan, or awaiting blood work results"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit for Triage Review</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import {
  AlertCircle,
  Calendar,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import type { RegisteredPatient } from "@/entities/patient";

export interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: RegisteredPatient;
}

export function RescheduleModal({
  open,
  onOpenChange,
  patient,
}: RescheduleModalProps) {
  const [preferredDate, setPreferredDate] = React.useState("2026-10-28");
  const [preferredTime, setPreferredTime] = React.useState("11:30 AM");
  const [reason, setReason] = React.useState("Interstate travel / logistics delay");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      toast.success("Reschedule Request Submitted", {
        description: `Your request for ${preferredDate} at ${preferredTime} was sent to ${patient.doctorInCharge}'s clinical desk at ${patient.centreName}. We will contact you via email and phone.`,
      });
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Request Appointment Reschedule
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Submit a proposed date or time adjustment for your upcoming clinical session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Current appointment info box */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Current Scheduled Visit
            </span>
            <div className="text-sm font-bold text-foreground">
              {patient.nextVisit?.date || "2026-10-27"} at {patient.nextVisit?.timeSlot || "08:30 AM"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {patient.nextVisit?.service || patient.primaryService}{patient.nextVisit?.room ? ` · ${patient.nextVisit.room}` : ""}
            </p>
          </div>

          {/* Clinical Confirmation Note */}
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Note:</strong> Your request will be reviewed by the clinical team to verify slot availability and maintain continuity of care.
            </span>
          </div>

          {/* Preferred New Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pref-date" className="text-xs font-medium">
                Preferred New Date *
              </Label>
              <Input
                id="pref-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pref-time" className="text-xs font-medium">
                Preferred Time Slot *
              </Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger id="pref-time" className="h-9 text-xs">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00 AM">09:00 AM (Morning)</SelectItem>
                  <SelectItem value="10:30 AM">10:30 AM (Late Morning)</SelectItem>
                  <SelectItem value="11:30 AM">11:30 AM (Midday)</SelectItem>
                  <SelectItem value="02:00 PM">02:00 PM (Afternoon)</SelectItem>
                  <SelectItem value="03:30 PM">03:30 PM (Late Afternoon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-1.5">
            <Label htmlFor="reason-select" className="text-xs font-medium">
              Primary Reason for Rescheduling *
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason-select" className="h-9 text-xs">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Interstate travel / logistics delay">
                  Interstate travel / transportation delay
                </SelectItem>
                <SelectItem value="Feeling unwell / adverse symptoms">
                  Feeling unwell / acute side effects
                </SelectItem>
                <SelectItem value="Work or emergency family conflict">
                  Work or urgent personal conflict
                </SelectItem>
                <SelectItem value="Other clinical requirement">
                  Other medical consultation clash
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="req-notes" className="text-xs font-medium">
              Additional Details (Optional)
            </Label>
            <Input
              id="req-notes"
              placeholder="e.g. Flight arrives at 10:00 AM in Lagos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Urgent Hotline */}
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
            <span>Need urgent same-day help?</span>
            <a
              href="tel:+23418880300"
              className="text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <Phone className="size-3" />
              +234 1 888 0300
            </a>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              <Send className="size-3.5" />
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

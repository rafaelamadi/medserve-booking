"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Repeat,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RescheduleRequest } from "@/data/reschedules-data";

interface ResolveRescheduleDialogProps {
  request: RescheduleRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (requestId: string, newStatus: "APPROVED" | "DECLINED") => void;
}

export function ResolveRescheduleDialog({
  request,
  open,
  onOpenChange,
  onResolved,
}: ResolveRescheduleDialogProps) {
  const [shiftBulkSeries, setShiftBulkSeries] = React.useState(true);
  // [SMS logic temporarily commented out; using Email via Resend]
  // const [sendSmsNotice, setSendSmsNotice] = React.useState(true);
  const [sendEmailNotice, setSendEmailNotice] = React.useState(true);
  const [clinicianNotes, setClinicianNotes] = React.useState("");

  if (!request) return null;

  const handleApprove = () => {
    onResolved(request.id, "APPROVED");

    toast.success("Reschedule Request Approved", {
      description: shiftBulkSeries && request.isBulkSeries
        ? `${request.patientName}'s appointment moved to ${request.requestedDate} and ${request.remainingVisitsCount} remaining sessions advanced skipping weekends.`
        : `${request.patientName}'s appointment rescheduled to ${request.requestedDate} (${request.requestedTimeSlot}).`,
    });

    // [SMS notification commented out]
    // if (sendSmsNotice) {
    //   toast.info("SMS Dispatched to Patient", {
    //     description: `Confirmation sent to ${request.phone} via MedServe SMS Gateway.`,
    //   });
    // }

    if (sendEmailNotice) {
      toast.info("Email Dispatched to Patient", {
        description: `Confirmation email sent to patient via MedServe Mailer (Resend Ready).`,
      });
    }

    onOpenChange(false);
  };

  const handleDecline = () => {
    onResolved(request.id, "DECLINED");
    toast.error("Reschedule Request Declined", {
      description: `Original appointment on ${request.currentDate} at ${request.currentTimeSlot} remains active.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary">
                {request.reference}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-foreground">
                {request.centreCode}
              </span>
            </div>

            <Badge
              variant="outline"
              className={
                request.urgency === "CRITICAL_BREAK"
                  ? "border-red-500/30 text-red-600 bg-red-500/10 text-xs font-semibold"
                  : request.urgency === "URGENT"
                    ? "border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs font-semibold"
                    : "border-blue-500/30 text-blue-600 bg-blue-500/10 text-xs"
              }
            >
              {request.urgency.replace(/_/g, " ")}
            </Badge>
          </div>

          <DialogTitle className="text-lg font-bold text-foreground">
            Review Reschedule: {request.patientName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Patient Ref: <span className="font-mono font-semibold text-foreground">{request.mrn}</span> • Contact: {request.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Side by side comparison: Current vs Requested */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current */}
            <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Current Scheduled Slot
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="font-mono">{request.currentDate}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="font-mono">{request.currentTimeSlot}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate pt-1">
                Room: {request.room}
              </p>
            </div>

            {/* Requested */}
            <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block">
                Requested New Slot
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarCheck className="size-4 text-primary" />
                <span className="font-mono text-primary">{request.requestedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Clock className="size-3.5 text-primary" />
                <span className="font-mono">{request.requestedTimeSlot}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-1">
                <CheckCircle2 className="size-3.5" />
                <span>Slot Available (No Schedule Conflict)</span>
              </div>
            </div>
          </div>

          {/* Reason & Requester info */}
          <div className="rounded-lg border bg-card p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Reason for Reschedule Request
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Requested by {request.requestedBy}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &ldquo;{request.reason}&rdquo;
            </p>
          </div>

          {/* Bulk Shifter & SMS switches */}
          <div className="space-y-3 rounded-lg border bg-muted/10 p-3.5">
            {request.isBulkSeries && (
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="bulk-shift" className="text-xs font-semibold text-foreground">
                    Bulk Shift Care Series ({request.remainingVisitsCount} remaining sessions)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically advance all subsequent treatment dates forward, skipping weekends and Nigerian public holidays.
                  </p>
                </div>
                <Switch
                  id="bulk-shift"
                  checked={shiftBulkSeries}
                  onCheckedChange={setShiftBulkSeries}
                />
              </div>
            )}

            {/* SMS logic commented out for Resend email transition */}
            {/*
            <div className="flex items-start justify-between gap-3 pt-1 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="send-sms" className="text-xs font-semibold text-foreground">
                  Dispatch Automated SMS Notification
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Text patient at <span className="font-mono text-foreground">{request.phone}</span> with their updated arrival date & time.
                </p>
              </div>
              <Switch id="send-sms" checked={sendSmsNotice} onCheckedChange={setSendSmsNotice} />
            </div>
            */}

            <div className="flex items-start justify-between gap-3 pt-1 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="send-email" className="text-xs font-semibold text-foreground">
                  Dispatch Automated Email Notification
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Email patient with their updated arrival date & time (via Resend).
                </p>
              </div>
              <Switch
                id="send-email"
                checked={sendEmailNotice}
                onCheckedChange={setSendEmailNotice}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDecline}
          >
            <XCircle className="size-4 mr-1.5" />
            Decline Request
          </Button>

          <Button
            type="button"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleApprove}
          >
            <CheckCircle2 className="size-4" />
            Approve & Reschedule Slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

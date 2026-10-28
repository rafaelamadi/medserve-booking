"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Repeat,
  Stethoscope,
  User,
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
import type { CentreCalendarEvent } from "@/data/centre-calendar-data";

interface AppointmentInspectorDialogProps {
  event: CentreCalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
}

export function AppointmentInspectorDialog({
  event,
  open,
  onOpenChange,
  onStatusChange,
}: AppointmentInspectorDialogProps) {
  const router = useRouter();

  if (!event) return null;

  const props = event.extendedProps;
  const isHoliday = props.mrn === "HOLIDAY" || props.mrn === "STAFF-QA";

  const handleCheckIn = () => {
    onStatusChange?.(event.id, "CHECKED_IN");
    toast.success("Patient Checked In", {
      description: `${props.patientName} is marked present at ${props.room}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className={
                props.centreCode === "MLCC"
                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-semibold"
                  : props.centreCode === "MKDC"
                    ? "border-blue-500/30 text-blue-600 bg-blue-500/10 font-semibold"
                    : "border-purple-500/30 text-purple-600 bg-purple-500/10 font-semibold"
              }
            >
              {props.centreCode}
            </Badge>

            <Badge
              variant={
                props.status === "COMPLETED"
                  ? "outline"
                  : props.status === "CHECKED_IN"
                    ? "default"
                    : "secondary"
              }
              className={
                props.status === "COMPLETED"
                  ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-xs"
                  : props.status === "CHECKED_IN"
                    ? "bg-emerald-600 text-white text-xs"
                    : "text-xs"
              }
            >
              {props.status}
            </Badge>
          </div>

          <DialogTitle className="text-lg font-bold text-foreground mt-1">
            {props.patientName}
          </DialogTitle>
          {!isHoliday && (
            <DialogDescription className="text-xs">
              Patient Ref: <span className="font-mono font-semibold text-foreground">{props.mrn}</span>
              {props.phone && ` • Contact: ${props.phone}`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* Service & Room */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <Stethoscope className="size-4 text-primary" />
              <span>{props.service}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{props.room} ({props.centreName})</span>
            </div>
          </div>

          {/* Time & Attending */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-card">
            <div>
              <span className="text-[11px] block text-muted-foreground font-semibold uppercase tracking-wider">
                Attending Specialist
              </span>
              <span className="font-medium text-foreground text-xs mt-0.5 block">
                {props.doctor}
              </span>
            </div>

            <div>
              <span className="text-[11px] block text-muted-foreground font-semibold uppercase tracking-wider">
                Slot Time
              </span>
              <span className="font-mono font-medium text-foreground text-xs mt-0.5 block">
                {typeof event.start === "object"
                  ? event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : String(event.start)}
              </span>
            </div>
          </div>

          {/* Clinical Notes */}
          {props.notes && (
            <div className="rounded-lg border bg-muted/10 p-2.5 space-y-1">
              <span className="text-[11px] font-semibold text-foreground">
                Encounter Notes:
              </span>
              <p className="text-muted-foreground italic leading-relaxed">
                &ldquo;{props.notes}&rdquo;
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {!isHoliday && props.patientId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                onOpenChange(false);
                router.push(`/dashboard/patients/${props.patientId}`);
              }}
            >
              <User className="size-3.5" />
              Patient Dossier
            </Button>
          )}

          {!isHoliday && props.status === "SCHEDULED" && (
            <Button
              type="button"
              size="sm"
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCheckIn}
            >
              <CheckCircle2 className="size-3.5" />
              Check In Patient
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

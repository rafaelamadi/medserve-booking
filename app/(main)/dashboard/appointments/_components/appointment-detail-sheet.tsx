"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ClockAlert,
  FileText,
  HeartPulse,
  Phone,
  PlayCircle,
  Repeat,
  Send,
  Stethoscope,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppointmentStatus, ClinicalAppointment } from "@/data/clinical-queue-data";
import { getInitials } from "@/lib/utils";

interface AppointmentDetailSheetProps {
  appointment: ClinicalAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, newStatus: AppointmentStatus) => void;
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
}: AppointmentDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "reschedule">("overview");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  if (!appointment) return null;

  const currentStatus = appointment.status;

  const handleUpdateStatus = (newStatus: AppointmentStatus, label: string) => {
    onStatusChange?.(appointment.id, newStatus);
    toast.success(`Status Updated: ${label}`, {
      description: `${appointment.patientName} (${appointment.reference}) is now ${label.toLowerCase()}.`,
    });
  };

  const handleApplyReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please specify both new date and time slot.");
      return;
    }
    toast.success("Reschedule Slot Proposed", {
      description: `New session slot: ${rescheduleDate} at ${rescheduleTime}. Notification queued for ${appointment.patientName}.`,
    });
    onStatusChange?.(appointment.id, "RESCHEDULE_REQUESTED");
    setActiveTab("overview");
  };

  const handleScheduleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;
    // [SMS notification commented out; using Email via Resend]
    toast.success("Follow-up Reminder Scheduled", {
      description: `Automated email notice scheduled for ${followUpDate} via MedServe Mailer (Resend Ready).`,
    });
    setFollowUpDate("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background overflow-hidden">
        {/* Header banner */}
        <div className="p-6 border-b bg-muted/20 space-y-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-xl bg-primary/10 text-primary font-semibold text-base border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(appointment.patientName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground tracking-tight">
                    {appointment.patientName}
                  </h3>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {appointment.patientMrn}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{appointment.patientPhone}</span>
                  <span>•</span>
                  <span className="font-mono">{appointment.reference}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                {appointment.centreCode}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">{appointment.room}</span>
            </div>
            <div>
              {currentStatus === "IN_TREATMENT" && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-semibold">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  In Treatment
                </Badge>
              )}
              {currentStatus === "CHECKED_IN" && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
                  <UserCheck className="size-3" />
                  Checked In
                </Badge>
              )}
              {currentStatus === "SCHEDULED" && (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Clock className="size-3" />
                  Scheduled ({appointment.timeSlot})
                </Badge>
              )}
              {currentStatus === "CONFIRMED" && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1">
                  <CheckCircle2 className="size-3" />
                  Confirmed
                </Badge>
              )}
              {currentStatus === "COMPLETED" && (
                <Badge variant="secondary" className="text-muted-foreground gap-1">
                  <CheckCircle2 className="size-3" />
                  Completed
                </Badge>
              )}
              {currentStatus === "RESCHEDULE_REQUESTED" && (
                <Badge variant="destructive" className="gap-1 font-medium">
                  <ClockAlert className="size-3" />
                  Reschedule Requested
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="w-full justify-start bg-transparent p-0 h-11 border-b-0 rounded-none gap-6">
              <TabsTrigger
                value="overview"
                className="relative h-11 rounded-none border-b-2 border-transparent px-1 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
              >
                Clinical Overview
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="relative h-11 rounded-none border-b-2 border-transparent px-1 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
              >
                Session Timeline & Audit
              </TabsTrigger>
              <TabsTrigger
                value="reschedule"
                className="relative h-11 rounded-none border-b-2 border-transparent px-1 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
              >
                Reschedule / Action
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Status Transition Actions */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="size-3.5 text-primary" />
                  Clinical Workflow Action
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(currentStatus === "SCHEDULED" || currentStatus === "CONFIRMED") && (
                    <Button
                      size="sm"
                      className="text-xs h-8.5 font-medium"
                      onClick={() => handleUpdateStatus("CHECKED_IN", "Checked In")}
                    >
                      <UserCheck className="size-3.5 mr-1.5" />
                      Check In Patient
                    </Button>
                  )}

                  {currentStatus === "CHECKED_IN" && (
                    <Button
                      size="sm"
                      className="text-xs h-8.5 font-medium bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleUpdateStatus("IN_TREATMENT", "In Treatment")}
                    >
                      <PlayCircle className="size-3.5 mr-1.5" />
                      Commence Treatment (Beam On)
                    </Button>
                  )}

                  {currentStatus === "IN_TREATMENT" && (
                    <Button
                      size="sm"
                      className="text-xs h-8.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpdateStatus("COMPLETED", "Completed")}
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" />
                      Complete Treatment Session
                    </Button>
                  )}

                  {currentStatus === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8.5 font-medium"
                      onClick={() =>
                        // [SMS notification commented out; using Email via Resend]
                        toast.success("Result Notice Dispatched", {
                          description: `Email notification queued for patient (Resend Ready).`,
                        })
                      }
                    >
                      <Send className="size-3.5 mr-1.5 text-primary" />
                      Send Result Notice
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8.5"
                    onClick={() => setActiveTab("reschedule")}
                  >
                    <ClockAlert className="size-3.5 mr-1.5 text-amber-600" />
                    Propose New Slot
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8.5"
                    onClick={() =>
                      toast.info(`Dialing ${appointment.patientPhone}...`, {
                        description: `Connecting clinician audio to ${appointment.patientName}`,
                      })
                    }
                  >
                    <Phone className="size-3.5 mr-1.5 text-blue-600" />
                    Call Patient
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                    onClick={() => handleUpdateStatus("NO_SHOW", "No-Show")}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    Mark No-Show
                  </Button>
                </div>
              </div>

              {/* Diagnosis & Care Protocol Card */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="size-3.5 text-primary" />
                    Oncology Regimen & Diagnosis
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    {appointment.modality}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground">
                    {appointment.diagnosis ?? "Oncology Evaluation & Treatment Course"}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {appointment.protocol ?? "Multidisciplinary treatment plan prescribed by oncologist."}
                  </p>
                </div>

                {appointment.fractionInfo && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Repeat className="size-3 text-primary" />
                        {appointment.fractionInfo}
                      </span>
                      <span className="text-muted-foreground">Fraction Progress: 56%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full w-[56%] transition-all" />
                    </div>
                  </div>
                )}
              </div>

              {/* Session Logistics Detail Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Scheduled Time
                  </span>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 font-mono">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {appointment.timeSlot}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Estimated Duration: {appointment.durationMinutes} mins
                  </span>
                </div>

                <div className="rounded-xl border p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Assigned Vault / Room
                  </span>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    {appointment.room}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {appointment.centreName}
                  </span>
                </div>

                <div className="rounded-xl border p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Prescribing Oncologist
                  </span>
                  <div className="text-sm font-semibold text-foreground">
                    {appointment.oncologist}
                  </div>
                  <span className="text-[11px] text-muted-foreground">Radiation Oncology Lead</span>
                </div>

                <div className="rounded-xl border p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Booking Source
                  </span>
                  <div className="text-sm font-semibold text-foreground font-mono">
                    CLINICAL_STAFF
                  </div>
                  <span className="text-[11px] text-muted-foreground">Direct Centre Booking</span>
                </div>
              </div>

              {/* Follow-up Reminder Fast Form */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  Schedule Post-Visit Follow-Up Reminder
                </div>
                <p className="text-xs text-muted-foreground">
                  Automate email delivery to the patient for review consultation or lab tests (Resend Ready).
                </p>

                <form onSubmit={handleScheduleFollowUp} className="flex gap-2">
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="h-8.5 text-xs flex-1"
                    required
                  />
                  <Button size="sm" type="submit" className="h-8.5 text-xs">
                    Schedule Follow-up
                  </Button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Audit Trail & Session Delivery Events
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {(appointment.timeline ?? [
                  { id: "e1", time: "Today, 08:30 AM", title: "Appointment Scheduled", detail: "Session booked in clinical queue", actor: "Staff" },
                  { id: "e2", time: "Oct 25, 10:00 AM", title: "Automated Reminder Email Sent", detail: "Sent via MedServe Mailer (Resend Ready)", actor: "System" },
                  { id: "e3", time: "Oct 20, 02:00 PM", title: "Treatment Plan Created", detail: "Care series registered by clinician", actor: appointment.oncologist },
                ]).map((event) => (
                  <div key={event.id} className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{event.title}</span>
                      <span className="text-muted-foreground font-mono text-[11px]">{event.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                    <span className="text-[11px] text-primary font-medium block">by {event.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reschedule" && (
            <form onSubmit={handleApplyReschedule} className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Propose Reschedule Slot
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a coordinated machine slot for {appointment.patientName} at {appointment.centreCode}.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-date" className="text-xs font-medium">New Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-time" className="text-xs font-medium">New Time Slot</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-reason" className="text-xs font-medium">Clinical Reason</Label>
                  <Input
                    id="reschedule-reason"
                    placeholder="e.g. Machine maintenance, patient toxicities, clinician conflict"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="h-8.5 text-xs"
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="h-8.5 text-xs">
                  Apply & Notify Patient
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

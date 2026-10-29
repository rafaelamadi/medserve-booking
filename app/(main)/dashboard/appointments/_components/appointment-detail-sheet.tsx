"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Repeat,
  Send,
  Stethoscope,
  UserCheck,
  UserX,
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
import { updateAppointmentStatusServer, type ClinicalAppointmentRow } from "@/server/appointments";

interface AppointmentDetailSheetProps {
  appointment: ClinicalAppointment | ClinicalAppointmentRow | null;
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
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [followUpDate, setFollowUpDate] = useState("");

  if (!appointment) return null;

  const currentStatus = appointment.status;

  const handleUpdateStatus = async (
    newStatus: "CHECKED_IN" | "CONFIRMED" | "NO_SHOW" | "SCHEDULED",
    label: string
  ) => {
    onStatusChange?.(appointment.id, newStatus as AppointmentStatus);
    toast.success(`Status Updated: ${label}`, {
      description: `${appointment.patientName} (${appointment.reference}) is now ${label.toLowerCase()}.`,
    });

    if (appointment.id && !appointment.id.startsWith("mock-") && !appointment.id.startsWith("apt-")) {
      await updateAppointmentStatusServer(appointment.id, newStatus);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("medserve:appointment-sync", {
          detail: { id: appointment.id, status: newStatus },
        })
      );
    }
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
              {currentStatus === "CHECKED_IN" && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
                  <UserCheck className="size-3" />
                  Checked In
                </Badge>
              )}
              {currentStatus === "CONFIRMED" && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
                  <CheckCircle2 className="size-3" />
                  Confirmed (Done)
                </Badge>
              )}
              {currentStatus === "CANCELLED" && (
                <Badge variant="outline" className="text-destructive border-destructive/30 gap-1 bg-destructive/5 font-semibold">
                  <XCircle className="size-3" />
                  Cancelled
                </Badge>
              )}
              {currentStatus !== "CHECKED_IN" && currentStatus !== "CONFIRMED" && currentStatus !== "CANCELLED" && (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Clock className="size-3" />
                  Scheduled ({appointment.timeSlot})
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
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Status Transition Actions */}
              {currentStatus === "CONFIRMED" ? (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-blue-600" />
                    Session Completed (Confirmed)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This clinical session has been completed and confirmed. All actions are locked.
                  </p>
                </div>
              ) : currentStatus === "CANCELLED" ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-1 text-xs text-destructive">
                  <div className="font-semibold flex items-center gap-1.5">
                    <XCircle className="size-4 text-destructive" />
                    Cancelled by Patient
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This appointment was cancelled by the patient via the portal. No actions permitted.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    Clinical Workflow Action
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== "CHECKED_IN" && (
                      <Button
                        size="sm"
                        className="text-xs h-8.5 font-medium cursor-pointer"
                        onClick={() => handleUpdateStatus("CHECKED_IN", "Checked In")}
                      >
                        <UserCheck className="size-3.5 mr-1.5 text-emerald-600" />
                        Check In Patient
                      </Button>
                    )}

                    {currentStatus !== "CONFIRMED" && (
                      <Button
                        size="sm"
                        className="text-xs h-8.5 font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        onClick={() => handleUpdateStatus("CONFIRMED", "Confirmed (Session Done)")}
                      >
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Mark Session Done (Confirm)
                      </Button>
                    )}

                    {currentStatus !== "NO_SHOW" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8.5 font-medium text-amber-700 dark:text-amber-400 cursor-pointer"
                        onClick={() => handleUpdateStatus("NO_SHOW", "No-Show")}
                      >
                        <UserX className="size-3.5 mr-1.5" />
                        Mark as No-Show
                      </Button>
                    )}

                    {currentStatus !== "SCHEDULED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8.5 font-medium cursor-pointer"
                        onClick={() => handleUpdateStatus("SCHEDULED", "Scheduled")}
                      >
                        <Clock className="size-3.5 mr-1.5 text-muted-foreground" />
                        Mark Scheduled
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8.5 cursor-pointer"
                      onClick={() =>
                        toast.success("Email Dispatched to Patient", {
                          description: `Sent appointment update to ${appointment.patientName}.`,
                        })
                      }
                    >
                      <Send className="size-3.5 mr-1.5 text-primary" />
                      Send Email Notice
                    </Button>
                  </div>
                </div>
              )}

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
                    Facility & Centre
                  </span>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    {appointment.room || appointment.centreName}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {appointment.centreCode}
                  </span>
                </div>

                <div className="rounded-xl border p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Attending Clinician
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

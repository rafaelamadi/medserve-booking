"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Repeat,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RegisteredPatient } from "@/data/patient-registry-data";
import { getInitials } from "@/lib/utils";

interface PatientDetailSheetProps {
  patient: RegisteredPatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePatient?: (updated: RegisteredPatient) => void;
}

export function PatientDetailSheet({
  patient,
  open,
  onOpenChange,
  onUpdatePatient,
}: PatientDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<"dossier" | "visits" | "comms">("dossier");
  if (!patient) return null;

  const percentComplete =
    patient.totalVisits > 0
      ? Math.round((patient.completedVisits / patient.totalVisits) * 100)
      : 0;

  // [SMS logic temporarily commented out; using Email via Resend]
  // const [smsMessage, setSmsMessage] = React.useState("");
  // const handleSendSms = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!smsMessage.trim()) return;
  //   const newLog = {
  //     id: `cl-${Date.now()}`,
  //     timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
  //     channel: "SMS" as const,
  //     type: "APPOINTMENT_REMINDER" as const,
  //     recipient: patient.phone,
  //     status: "DELIVERED" as const,
  //     messageSnippet: smsMessage,
  //   };
  //   const updated: RegisteredPatient = { ...patient, commLogs: [newLog, ...patient.commLogs] };
  //   onUpdatePatient?.(updated);
  //   toast.success("SMS Reminder Sent", { description: `Dispatched to ${patient.phone} via MedServe SMS Gateway.` });
  //   setSmsMessage("");
  // };

  // Active Email Dispatch (Resend Ready)
  const [emailMessage, setEmailMessage] = React.useState("");

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailMessage.trim()) return;

    const patientEmail = patient.email || `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`;

    const newLog = {
      id: `cl-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      channel: "EMAIL" as const,
      type: "APPOINTMENT_REMINDER" as const,
      recipient: patientEmail,
      status: "DELIVERED" as const,
      messageSnippet: emailMessage,
    };

    const updated: RegisteredPatient = {
      ...patient,
      commLogs: [newLog, ...patient.commLogs],
    };

    onUpdatePatient?.(updated);
    toast.success("Email Reminder Sent", {
      description: `Dispatched to ${patientEmail} via MedServe Mailer (Resend Ready).`,
    });
    setEmailMessage("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[92vw] md:w-[88vw] lg:w-[82vw] xl:w-[78vw] max-w-[1360px] overflow-y-auto p-0 flex flex-col gap-0 border-l bg-background shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b bg-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-xl border bg-primary/10 text-primary font-bold text-base">
                <AvatarFallback className="rounded-xl">
                  {getInitials(patient.fullName)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-bold tracking-tight">
                    {patient.fullName}
                  </SheetTitle>
                  <Badge variant="outline" className="font-mono text-xs font-semibold">
                    {patient.mrn}
                  </Badge>
                  <Badge
                    variant={
                      patient.status === "ACTIVE"
                        ? "default"
                        : patient.status === "COMPLETED"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      patient.status === "ACTIVE"
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]"
                        : "text-[11px]"
                    }
                  >
                    {patient.status}
                  </Badge>
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3">
                  <span>{patient.gender && patient.age ? `${patient.gender}, ${patient.age} years` : patient.gender || (patient.age ? `${patient.age} years` : "Unspecified Demographics")}</span>
                  <span>•</span>
                  <span>{patient.phone || "—"}</span>
                  <span>•</span>
                  <span>{patient.centreName}</span>
                </SheetDescription>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(patient.phone);
                  toast.success("Phone Number Copied", { description: patient.phone });
                }}
              >
                <Phone className="size-3.5" />
                <span className="hidden sm:inline">Copy Phone</span>
              </Button>

              {patient.scheduleRef && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                  <Link href="/dashboard/calendar">
                    <Calendar className="size-3.5" />
                    <span>View Centre Calendar</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Treatment Progress Strip */}
        <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-muted-foreground font-medium">Primary Condition & Encounters</span>
            <div className="text-sm font-bold text-foreground">
              {patient.primaryDiagnosis}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Under care of <strong className="text-foreground">{patient.doctorInCharge}</strong> · {patient.primaryService}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-muted-foreground">Overall Treatment Course</span>
              <div className="text-sm font-bold tabular-nums text-foreground">
                {patient.completedVisits} / {patient.totalVisits} visits completed
              </div>
            </div>
            <div className="h-2 w-28 rounded-full bg-secondary overflow-hidden hidden sm:block">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col p-5 space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="dossier" className="text-xs flex items-center gap-1.5">
              <User className="size-3.5" />
              Patient Dossier
            </TabsTrigger>
            <TabsTrigger value="visits" className="text-xs flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              All Visits ({patient.visits.length})
            </TabsTrigger>
            <TabsTrigger value="comms" className="text-xs flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              SMS & Communication Log ({patient.commLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PATIENT DOSSIER */}
          <TabsContent value="dossier" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demographics Card */}
              <div className="rounded-xl border p-4 bg-card space-y-3 shadow-2xs">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  Demographics & Identification
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Full Legal Name</span>
                    <span className="font-semibold text-foreground text-sm">{patient.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Medical Record No. (MRN)</span>
                    <span className="font-mono font-bold text-foreground text-sm">{patient.mrn}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Age & Biological Sex</span>
                    <span className="font-medium text-foreground">{patient.age} yrs · {patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Registration Date</span>
                    <span className="font-medium text-foreground">{patient.registrationDate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{patient.address}, {patient.state}</span>
                  </div>
                </div>
              </div>

              {/* Clinical Protocol & Doctor */}
              <div className="rounded-xl border p-4 bg-card space-y-3 shadow-2xs">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="size-3.5 text-primary" />
                  Clinical Protocol & Care Team
                </span>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Primary Oncological Diagnosis</span>
                    <span className="font-semibold text-foreground text-sm">{patient.primaryDiagnosis}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Doctor in Charge</span>
                      <span className="font-semibold text-foreground">{patient.doctorInCharge}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Primary Service</span>
                      <span className="font-semibold text-foreground">{patient.primaryService}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block text-[11px]">Registered Centre</span>
                    <span className="font-semibold text-foreground">{patient.centreName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Visit Banner */}
            {patient.nextVisit && (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Next Scheduled Visit
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {patient.nextVisit.service} · {patient.nextVisit.room}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {patient.nextVisit.date} at {patient.nextVisit.timeSlot}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="border-primary text-primary font-semibold text-xs py-1 px-3 self-start sm:self-auto">
                  Confirmed On Schedule
                </Badge>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: ALL VISITS & ENCOUNTERS */}
          <TabsContent value="visits" className="mt-0 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Chronological record of every clinic appointment and treatment session</span>
              <span className="font-mono font-medium">{patient.completedVisits} Completed / {patient.totalVisits} Total</span>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto divide-y">
                {patient.visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border font-semibold text-xs">
                        <Calendar className="size-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{v.serviceName}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">{v.reference}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium text-foreground">{v.date}</span>
                          <span>•</span>
                          <span>{v.timeSlot}</span>
                          <span>•</span>
                          <span>{v.room}</span>
                          <span>•</span>
                          <span>Doctor: {v.doctor}</span>
                        </div>
                        {v.notes && (
                          <p className="text-[11px] text-muted-foreground italic pt-0.5">
                            {v.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={
                        v.status === "COMPLETED"
                          ? "default"
                          : v.status === "IN_TREATMENT"
                            ? "destructive"
                            : "outline"
                      }
                      className={
                        v.status === "COMPLETED"
                          ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]"
                          : v.status === "IN_TREATMENT"
                            ? "bg-amber-600 hover:bg-amber-600 text-white text-[11px]"
                            : "text-[11px]"
                      }
                    >
                      {v.status}
                    </Badge>
                  </div>
                ))}

                {patient.visits.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No visit records found.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: COMMUNICATION LOG & QUICK EMAIL (RESEND READY) */}
          <TabsContent value="comms" className="mt-0 space-y-4">
            {/* Quick Email Box (Resend Ready) */}
            <form onSubmit={handleSendEmail} className="rounded-xl border p-4 bg-card space-y-3 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" />
                Dispatch Email Notice (Resend Ready)
              </span>

              <div className="space-y-1.5">
                <Input
                  placeholder={`Type clinical notice to email ${patient.email || `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`}...`}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  Recipient: <strong className="text-foreground">{patient.email || `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`}</strong>
                </span>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={!emailMessage.trim()}>
                  <Send className="size-3" />
                  Send Email
                </Button>
              </div>
            </form>

            {/* Comm Log Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Communication History
              </span>

              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {patient.commLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">
                          {log.channel}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {log.timestamp}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            log.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {log.messageSnippet}
                      </p>
                    </div>
                  </div>
                ))}

                {patient.commLogs.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No automated SMS or call dispatches recorded yet.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <SheetFooter className="p-4 border-t bg-muted/20 flex flex-row justify-between items-center sm:justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {patient.mrn} · {patient.centreCode}
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close Dossier
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  REGISTERED_PATIENTS,
  type RegisteredPatient,
} from "@/data/patient-registry-data";
import { getInitials } from "@/lib/utils";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [patient, setPatient] = React.useState<RegisteredPatient | null>(() => {
    const found = REGISTERED_PATIENTS.find(
      (p) => p.id === patientId || p.mrn.toLowerCase() === patientId?.toLowerCase(),
    );
    return found || REGISTERED_PATIENTS[0];
  });

  // [SMS dispatch logic commented out - transitioning to Resend Email notifications]
  // const [smsText, setSmsText] = React.useState("");
  // const handleSendSms = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!smsText.trim()) return;
  //   const newLog = {
  //     id: `cl-${Date.now()}`,
  //     timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
  //     channel: "SMS" as const,
  //     type: "APPOINTMENT_REMINDER" as const,
  //     recipient: patient.phone,
  //     status: "DELIVERED" as const,
  //     messageSnippet: smsText,
  //   };
  //   setPatient((prev) => prev ? { ...prev, commLogs: [newLog, ...prev.commLogs] } : null);
  //   toast.success("SMS Dispatched", { description: `Message sent to ${patient.phone} via MedServe SMS Gateway.` });
  //   setSmsText("");
  // };

  // Active Email Dispatch (Resend Ready)
  const [emailSubject, setEmailSubject] = React.useState("Clinical Appointment Notice - MedServe");
  const [emailBody, setEmailBody] = React.useState("");

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailBody.trim()) return;

    const patientEmail = patient?.email || `${patient?.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`;

    const newLog = {
      id: `cl-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      channel: "EMAIL" as const,
      type: "APPOINTMENT_REMINDER" as const,
      recipient: patientEmail,
      status: "DELIVERED" as const,
      messageSnippet: `${emailSubject}: ${emailBody}`,
    };

    setPatient((prev) =>
      prev
        ? {
            ...prev,
            commLogs: [newLog, ...prev.commLogs],
          }
        : null,
    );

    toast.success("Email Dispatched", {
      description: `Notification dispatched to ${patientEmail} via MedServe Mailer (Resend Ready).`,
    });
    setEmailBody("");
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
        <h2 className="text-xl font-bold">Patient Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested patient record could not be found.</p>
        <Button onClick={() => router.push("/dashboard/patients")} variant="outline">
          Back to Patient Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => router.push("/dashboard/patients")}
          >
            <ArrowLeft className="size-4" />
            Back to Registry
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-xs font-mono text-muted-foreground">{patient.mrn}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => window.print()}
          >
            <FileText className="size-3.5" />
            Print Dossier
          </Button>
          {patient.scheduleRef && (
            <Button
              asChild
              size="sm"
              className="h-8 gap-1.5 text-xs"
            >
              <Link href="/dashboard/series">
                <Repeat className="size-3.5" />
                View Care Schedule
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Patient Master Identification Card */}
      <Card className="shadow-xs border-border/80 p-6 bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar className="size-16 rounded-2xl border-2 border-primary/20 bg-primary/10 text-primary font-bold text-xl shrink-0">
              <AvatarFallback className="rounded-2xl">
                {getInitials(patient.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {patient.fullName}
                </h1>
                <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                  {patient.mrn}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{patient.gender}, {patient.age} years</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {patient.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {patient.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {patient.state}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 text-xs text-muted-foreground">
            <div>
              <span className="block text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                Registration Date
              </span>
              <span className="font-medium text-foreground text-sm tabular-nums">
                {patient.registrationDate}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                Total Visits
              </span>
              <span className="font-medium text-foreground text-sm tabular-nums">
                {patient.visits?.length || 0} encounters
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for In-depth History */}
      <Tabs defaultValue="visits" className="space-y-6">
        <TabsList className="bg-muted/70 p-1 border">
          <TabsTrigger value="visits" className="gap-2 text-xs py-2 px-4">
            <CalendarCheck className="size-3.5" />
            Visits & Encounter History ({patient.visits?.length || 0})
          </TabsTrigger>

          <TabsTrigger value="courses" className="gap-2 text-xs py-2 px-4">
            <Repeat className="size-3.5" />
            Care Schedules & Series
          </TabsTrigger>

          <TabsTrigger value="comms" className="gap-2 text-xs py-2 px-4">
            <MessageSquare className="size-3.5" />
            Communication & Dispatch Log ({patient.commLogs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Detailed Encounter History */}
        <TabsContent value="visits" className="space-y-4 mt-0">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Clinical Encounters & Doctor History
              </CardTitle>
              <CardDescription className="text-xs">
                Chronological record of every clinic visit, consultation, and treatment session across all MedServe centres.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {patient.visits && patient.visits.length > 0 ? (
                patient.visits.map((visit, index) => (
                  <div
                    key={visit.id || index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-card/60 hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="size-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {visit.serviceName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {visit.reference}
                          </Badge>
                          <Badge
                            variant={
                              visit.status === "COMPLETED"
                                ? "outline"
                                : visit.status === "SCHEDULED"
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              visit.status === "COMPLETED"
                                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-[10px]"
                                : "text-[10px]"
                            }
                          >
                            {visit.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Attending: {visit.doctor}</span>
                          <span>•</span>
                          <span>Location: {visit.room}</span>
                        </div>

                        {visit.notes && (
                          <p className="text-xs text-muted-foreground/90 bg-muted/40 p-2 rounded border border-border/50 mt-1 italic">
                            &ldquo;{visit.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right text-xs shrink-0 pl-11 sm:pl-0">
                      <span className="font-medium text-foreground block font-mono">
                        {visit.date}
                      </span>
                      <span className="text-muted-foreground">
                        {visit.timeSlot}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No previous encounters recorded for this patient.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Treatment & Care Schedules */}
        <TabsContent value="courses" className="space-y-4 mt-0">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Treatment Courses & Care Schedules
              </CardTitle>
              <CardDescription className="text-xs">
                Multi-day radiotherapy or chemotherapy itineraries assigned to this patient.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {patient.scheduleRef ? (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {patient.primaryService}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {patient.scheduleRef}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Indication: {patient.primaryDiagnosis}
                      </p>
                    </div>

                    <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                      <Link href="/dashboard/series">
                        <Calendar className="size-3.5" />
                        Open Calendar View
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Progress: {patient.completedVisits} of {patient.totalVisits} sessions completed
                      </span>
                      <span className="font-bold text-primary tabular-nums">
                        {patient.totalVisits > 0
                          ? Math.round((patient.completedVisits / patient.totalVisits) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${
                            patient.totalVisits > 0
                              ? Math.round((patient.completedVisits / patient.totalVisits) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {patient.nextVisit && (
                    <div className="flex items-center gap-2 text-xs bg-card p-2.5 rounded-lg border">
                      <Clock className="size-3.5 text-primary" />
                      <span className="text-muted-foreground">Next Scheduled Session:</span>
                      <span className="font-medium text-foreground">
                        {patient.nextVisit.date} at {patient.nextVisit.timeSlot}
                      </span>
                      <span className="text-muted-foreground">({patient.nextVisit.room})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Patient is not currently enrolled in a multi-day visit series.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Communication & Email Dispatch (Resend Ready) */}
        <TabsContent value="comms" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-xs border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">
                  Communication History
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated appointment reminders, schedule changes, and clinic dispatch logs.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {patient.commLogs && patient.commLogs.length > 0 ? (
                  patient.commLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border bg-card/60 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {log.channel}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {log.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[11px] tabular-nums">{log.timestamp}</span>
                      </div>
                      <p className="text-muted-foreground">{log.messageSnippet}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>Recipient: {log.recipient}</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No communication logs found for this patient.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Email Dispatcher (Resend Ready) */}
            <Card className="shadow-xs border-border/80 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  Dispatch Email
                </CardTitle>
                <CardDescription className="text-xs">
                  Send notification or clinic instructions to <span className="font-medium text-foreground">{patient.email || `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`}</span>.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="email-subject" className="text-xs">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Appointment Confirmation"
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email-body" className="text-xs">Email Message</Label>
                    <textarea
                      id="email-body"
                      rows={4}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={`Dear ${patient.fullName.split(" ")[0]},\n\nYour clinical appointment at MedServe is scheduled for...`}
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* SMS Dispatcher Form commented out for Resend transition */}
                  {/*
                  <div className="pt-2 border-t text-[11px] text-muted-foreground">
                    SMS & WhatsApp dispatching temporarily disabled in favour of Email.
                  </div>
                  */}

                  <Button type="submit" size="sm" className="w-full gap-1.5 text-xs">
                    <Send className="size-3.5" />
                    Send Email (via Resend)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

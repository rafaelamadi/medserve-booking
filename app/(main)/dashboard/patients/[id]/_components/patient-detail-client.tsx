"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RegisteredPatient } from "@/data/patient-registry-data";
import { sendPatientEmailNoticeServer } from "@/server/patients";
import {
  EMAIL_TEMPLATE_LIST,
  type EmailTemplateKey,
  renderEmailTemplate,
} from "@/shared/templates/email-templates";

interface PatientDetailClientProps {
  initialPatient: RegisteredPatient;
}

export function PatientDetailClient({ initialPatient }: PatientDetailClientProps) {
  const router = useRouter();
  const [patient, setPatient] = React.useState<RegisteredPatient>(initialPatient);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);

  // Synchronize with external real-time events without extra POST actions
  React.useEffect(() => {
    const handleSync = () => {
      router.refresh();
    };
    window.addEventListener("medserve:appointment-sync", handleSync);
    window.addEventListener("medserve:patient-sync", handleSync);
    return () => {
      window.removeEventListener("medserve:appointment-sync", handleSync);
      window.removeEventListener("medserve:patient-sync", handleSync);
    };
  }, [router]);

  // Keep state updated if initialPatient changes via router.refresh()
  React.useEffect(() => {
    setPatient(initialPatient);
  }, [initialPatient]);

  // Active Email Dispatch with Centralized Templates
  const [selectedTemplateKey, setSelectedTemplateKey] = React.useState<EmailTemplateKey>("APPOINTMENT_CONFIRMATION");
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailBody, setEmailBody] = React.useState("");

  const templateCtx = React.useMemo(() => {
    const cleanServiceName = patient.primaryService?.replace(/\s*\([^)]*\)/g, "").trim() || "Consultation";
    const upcomingVisit = patient.visits?.[0];
    const timeSlot = upcomingVisit ? `${upcomingVisit.date} at ${upcomingVisit.timeSlot}` : "your scheduled slot";
    return {
      patientName: patient.fullName,
      patientEmail: patient.email,
      patientMrn: patient.mrn,
      centreName: patient.centreName,
      centreCode: patient.centreCode,
      serviceName: cleanServiceName,
      timeSlot,
      reference: upcomingVisit?.reference || patient.mrn,
    };
  }, [patient]);

  // Sync template text whenever template or patient changes
  React.useEffect(() => {
    if (templateCtx && selectedTemplateKey) {
      const rendered = renderEmailTemplate(selectedTemplateKey, templateCtx);
      setEmailSubject(rendered.subject);
      setEmailBody(rendered.body);
    }
  }, [selectedTemplateKey, templateCtx]);

  const handleTemplateSelect = (key: EmailTemplateKey) => {
    setSelectedTemplateKey(key);
    if (templateCtx) {
      const rendered = renderEmailTemplate(key, templateCtx);
      setEmailSubject(rendered.subject);
      setEmailBody(rendered.body);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailBody.trim()) return;

    try {
      setIsSendingEmail(true);
      const res = await sendPatientEmailNoticeServer(
        patient.id,
        emailSubject,
        emailBody,
        selectedTemplateKey
      );

      if (res.success && res.log) {
        setPatient((prev) => ({
          ...prev,
          commLogs: [res.log!, ...prev.commLogs],
        }));

        toast.success("Email Sent Successfully", {
          description: `Dispatched "${emailSubject}" to ${patient.email || patient.fullName} and permanently logged in Supabase.`,
        });
      } else {
        toast.error("Dispatch Failed", {
          description: res.error || "Could not log notification in database.",
        });
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      toast.error("An unexpected error occurred while sending email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

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
        </div>
      </div>

      {/* Patient Master Identification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {patient.fullName}
            </h1>
            <span className="font-mono text-sm font-medium text-muted-foreground">
              {patient.mrn}
            </span>
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

      {/* Tabs for In-depth History */}
      <Tabs defaultValue="visits" className="space-y-6">
        <TabsList size="lg" className="inline-flex h-12 bg-muted/80 rounded-xl p-1.5 gap-1.5 border items-center">
          <TabsTrigger
            value="visits"
            className="flex items-center gap-2 text-sm font-semibold py-2.5 px-5 rounded-lg h-9.5 data-active:bg-background data-active:shadow-sm"
          >
            <CalendarCheck className="size-4" />
            Visits & Encounter History ({patient.visits?.length || 0})
          </TabsTrigger>

          <TabsTrigger
            value="comms"
            className="flex items-center gap-2 text-sm font-semibold py-2.5 px-5 rounded-lg h-9.5 data-active:bg-background data-active:shadow-sm"
          >
            <MessageSquare className="size-4" />
            Communication & Dispatch Log ({patient.commLogs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Detailed Encounter History */}
        <TabsContent value="visits" className="space-y-4 mt-0">
          <div className="space-y-3">
            <div className="pb-1">
              <h2 className="text-base font-bold text-foreground">
                Clinical Encounters & Doctor History
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chronological record of every clinic visit, consultation, and treatment session across all MedServe centres.
              </p>
            </div>

            <div className="space-y-3">
              {patient.visits && patient.visits.length > 0 ? (
                patient.visits.map((visit, index) => {
                  const cleanDoctor = (visit.doctor || patient.doctorInCharge || "Dr. Kachi").replace(/^Attending\s+/i, "");
                  return (
                    <div
                      key={visit.id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-card/60 hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {visit.serviceName}
                          </span>
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
                          <span className="font-medium text-foreground">Attending: {cleanDoctor}</span>
                          <span>•</span>
                          <span>Location: {visit.room}</span>
                        </div>

                        {visit.notes && (
                          <p className="text-xs text-muted-foreground/90 bg-muted/40 p-2 rounded border border-border/50 mt-1 italic">
                            &ldquo;{visit.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right text-xs shrink-0">
                        <span className="font-medium text-foreground block font-mono">
                          {visit.date}
                        </span>
                        <span className="text-muted-foreground">
                          {visit.timeSlot}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed">
                  No previous encounters recorded for this patient.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Communication & Email Dispatch (Resend Ready) */}
        <TabsContent value="comms" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="pb-1">
                <h2 className="text-base font-bold text-foreground">
                  Communication History
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated appointment reminders, schedule changes, and clinic dispatch logs.
                </p>
              </div>

              <div className="space-y-3">
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
                  <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed">
                    No communication logs found for this patient.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Email Dispatcher */}
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
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-template-select" className="text-sm font-semibold text-foreground">
                      Choose Template / Message Type
                    </Label>
                    <Select
                      value={selectedTemplateKey}
                      onValueChange={(val) => handleTemplateSelect(val as EmailTemplateKey)}
                    >
                      <SelectTrigger
                        id="email-template-select"
                        className="w-full h-11 py-2 px-4 text-sm font-medium rounded-xl border border-input cursor-pointer text-left"
                      >
                        <SelectValue placeholder="Select an email template..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl p-1">
                        {EMAIL_TEMPLATE_LIST.map((tpl) => (
                          <SelectItem
                            key={tpl.key}
                            value={tpl.key}
                            className="py-2 px-3 rounded-lg text-sm cursor-pointer font-medium"
                          >
                            {tpl.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-subject" className="text-sm font-semibold text-foreground">
                      Subject
                    </Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Appointment Confirmation"
                      className="h-11 text-sm font-medium px-4 rounded-xl border-border/80"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-body" className="text-sm font-semibold text-foreground">
                      Email Message
                    </Label>
                    <textarea
                      id="email-body"
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={`Dear ${patient.fullName.split(" ")[0]},\n\nYour clinical appointment at MedServe is scheduled for...`}
                      className="w-full rounded-xl border border-input bg-background p-3.5 text-sm outline-none focus:ring-1 focus:ring-primary leading-relaxed font-sans"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSendingEmail}
                    className="w-full mt-2 gap-2 text-sm font-medium rounded-xl h-11"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Email
                      </>
                    )}
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

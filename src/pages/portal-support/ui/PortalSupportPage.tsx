"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from "@/shared/ui";
import { CANCER_CENTRES_DATA, type CancerCentreDetail } from "@/entities/centre/model/settings";
import { usePatientPortalStore, type RegisteredPatient } from "@/entities/patient";

export function PortalSupportContent({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  const { patient, setPatient } = usePatientPortalStore();

  React.useEffect(() => {
    if (initialPatient && (!patient || patient.id !== initialPatient.id || patient.fullName === "Chidinma Nwosu")) {
      setPatient(initialPatient);
    }
  }, [initialPatient, patient, setPatient]);

  const activePatient = initialPatient || patient;

  // Contact form state
  const [selectedCentre, setSelectedCentre] = React.useState<string>(
    activePatient?.centreCode || "MLCC"
  );
  const [category, setCategory] = React.useState<string>("Appointments & Scheduling");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedMessage, setSubmittedMessage] = React.useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter a subject and your message before submitting.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMessage(subject);
      setSubject("");
      setMessage("");
      toast.success("Message dispatched to the centre care coordinator! A confirmation has been sent to your email.");
    }, 800);
  };

  return (
    <div className="@container/main flex flex-col gap-8 max-w-6xl mx-auto w-full py-2">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Headphones className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Support & Centre Directory
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Access direct contact phone numbers, addresses, and operating hours for all MedServe centres across Nigeria, or send an inquiry to your care team.
          </p>
        </div>

        {/* Quick Triage Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button asChild size="default" className="h-9 px-4 gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
            <a href="tel:+23418880300">
              <Phone className="size-3.5" />
              Call Central Desk
            </a>
          </Button>
        </div>
      </div>

      {/* 2. Centre Directory Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            MedServe Centres & Direct Helplines
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each centre maintains a clinical triage line, on-site patient coordinators, and dedicated email desks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CANCER_CENTRES_DATA.map((centre) => {
            const isAssigned = (activePatient.centreCode || "MLCC") === centre.code;
            return (
              <div
                key={centre.id}
                className={`p-5 rounded-2xl border bg-card flex flex-col justify-between space-y-4 transition-all duration-200 ${
                  isAssigned ? "border-primary/50 shadow-sm ring-1 ring-primary/20" : "hover:border-border/80"
                }`}
              >
                <div className="space-y-3">
                  {/* Centre Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        {centre.code}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {centre.city}
                      </span>
                    </div>
                    {isAssigned && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        Your Care Centre
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {centre.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-2 leading-relaxed">
                      <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{centre.address}</span>
                    </p>
                  </div>

                  {/* Hours */}
                  <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="size-3 text-primary" />
                      Operating Hours
                    </div>
                    <div>Weekdays: {centre.operatingHours?.weekdays || "08:00 AM – 05:00 PM"}</div>
                    <div>Weekends: {centre.operatingHours?.weekends || "Emergency On-Call"}</div>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <Button asChild size="sm" className="w-full gap-2 text-xs font-semibold h-9 bg-primary/10 hover:bg-primary/20 text-primary">
                    <a href={`tel:${centre.phone.replace(/\s+/g, "")}`}>
                      <Phone className="size-3.5" />
                      Call {centre.phone}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs font-medium h-9">
                    <a href={`mailto:${centre.email}?subject=MedServe%20Patient%20Inquiry%20-%20MRN%20${activePatient.mrn || ""}`}>
                      <Mail className="size-3.5" />
                      {centre.email}
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Send Message to Centre Desk Form */}
      <div className="p-6 rounded-2xl border bg-card space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            Send an Inquiry to Your Centre
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit a message directly to the patient coordinator desk. We usually respond within 2 to 4 business hours.
          </p>
        </div>

        {submittedMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Your inquiry &ldquo;{submittedMessage}&rdquo; has been registered. Our coordination team will contact you at <strong>{activePatient.email}</strong>.
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              onClick={() => setSubmittedMessage(null)}
            >
              Send Another
            </Button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Centre */}
            <div className="space-y-1.5">
              <Label htmlFor="centre-select" className="text-xs font-semibold">
                Destination Centre *
              </Label>
              <select
                id="centre-select"
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CANCER_CENTRES_DATA.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Inquiry Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category-select" className="text-xs font-semibold">
                Inquiry Topic *
              </Label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Appointments & Scheduling">Appointments & Scheduling</option>
                <option value="Treatment Queries & Vitals">Treatment Queries & Vitals</option>
                <option value="Medical Records & Clinic Pass">Medical Records & Clinic Pass</option>
                <option value="Billing & Health Insurance">Billing & Health Insurance</option>
                <option value="General Support">General Support</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry-subject" className="text-xs font-semibold">
              Subject *
            </Label>
            <Input
              id="inquiry-subject"
              placeholder="e.g., Question regarding my upcoming session or schedule change"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry-message" className="text-xs font-semibold">
              Message Details *
            </Label>
            <Textarea
              id="inquiry-message"
              rows={4}
              placeholder="Provide any relevant details, preferred call-back times, or specific questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Responses are delivered securely to your verified email (<strong>{activePatient.email}</strong>).</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 gap-2 text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send Inquiry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PortalSupportPage({ initialPatient }: { initialPatient?: RegisteredPatient }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-sm text-muted-foreground">
          Loading support...
        </div>
      }
    >
      <PortalSupportContent initialPatient={initialPatient} />
    </React.Suspense>
  );
}

export default PortalSupportPage;

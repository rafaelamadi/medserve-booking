"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  findBookingByRef,
  type PublicBookingRecord,
} from "@/data/booking-catalogue";

export default function BookingConfirmedPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || "MLCC-2610-001";

  const [booking, setBooking] = React.useState<PublicBookingRecord | null>(() => {
    return findBookingByRef(reference);
  });

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reference);
    toast.success("Reference Copied", { description: reference });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
              <Activity className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground block">
                MedServe
              </span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Oncology & Diagnostics
              </span>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Link href="/manage">
              Manage Booking
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Success Hero Banner */}
        <div className="text-center space-y-3">
          <div className="mx-auto size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="size-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Appointment Confirmed
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your booking request has been logged in the MedServe clinical scheduling system.
          </p>
        </div>

        {/* Reference Highlight Pill */}
        <Card className="border p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Booking Reference Number
            </span>
            <div className="text-2xl font-mono font-extrabold text-primary tracking-wide mt-0.5">
              {reference}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Save this reference to check in or track your appointment status.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRef}
              className="gap-1.5 text-xs h-9"
            >
              <Copy className="size-3.5" />
              <span>Copy Ref</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs h-9"
            >
              <Printer className="size-3.5" />
              <span>Print Slip</span>
            </Button>
          </div>
        </Card>

        {/* Appointment Details Dossier */}
        <Card className="border rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Selected Medical Facility
              </span>
              <h3 className="font-bold text-base text-foreground mt-0.5">
                {booking?.centreName || "MedServe LUTH Cancer Centre"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {booking?.centreAddress || "LUTH Complex, Idi-Araba, Surulere, Lagos"}
              </p>
            </div>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs px-2.5 py-0.5">
              {booking?.status || "CONFIRMED"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Clinical Procedure
              </span>
              <div className="font-bold text-foreground text-sm">
                {booking?.serviceName || "Radiotherapy Session (VMAT)"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Duration: approx. {booking?.durationMinutes || 20} minutes
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Date & Time Slot
              </span>
              <div className="font-bold text-foreground text-sm">
                {booking?.date || "2026-10-28"} at {booking?.timeSlot || "09:15 AM"}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                Please arrive 15 minutes early (09:00 AM)
              </p>
            </div>
          </div>

          {/* Patient Contact Info */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1 text-xs">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
              Patient Record
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-0.5">
              <span className="font-semibold text-foreground">
                {booking?.patientName || "Fatima Bello"}
              </span>
              <span>•</span>
              <span className="font-mono text-muted-foreground">
                {booking?.patientPhone || "+234 803 000 0000"}
              </span>
              {booking?.patientEmail && (
                <>
                  <span>•</span>
                  <span className="text-muted-foreground">{booking.patientEmail}</span>
                </>
              )}
            </div>
          </div>

          {/* Procedural Preparation Instructions */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Stethoscope className="size-4" />
              <span>Procedural Guidelines & Instructions</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {booking?.prepInstructions ||
                "Drink 500ml of water 30 minutes before appointment. Maintain comfortably full bladder. Wear comfortable clothing without metallic buttons or underwires."}
            </p>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs">
            <Link href="/book">
              Book Another Appointment
            </Link>
          </Button>

          <Button asChild size="sm" className="w-full sm:w-auto text-xs gap-1.5">
            <Link href={`/manage?ref=${reference}`}>
              <span>Lookup / Manage Booking</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

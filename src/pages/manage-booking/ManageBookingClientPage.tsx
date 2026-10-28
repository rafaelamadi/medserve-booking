"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Search,
  Stethoscope,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/shared/ui";
import {
  findBookingByRef,
  type PublicBookingRecord,
  saveBooking,
} from "@/entities/appointment";

export default function ManageBookingPage() {
  const searchParams = useSearchParams();
  const initialRef = searchParams?.get("ref") || "";

  const [referenceInput, setReferenceInput] = React.useState(initialRef);
  const [phoneInput, setPhoneInput] = React.useState("");
  const [activeBooking, setActiveBooking] = React.useState<PublicBookingRecord | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("Patient schedule conflict");

  // If initialRef is provided in query params, try auto-lookup
  React.useEffect(() => {
    if (initialRef) {
      const found = findBookingByRef(initialRef);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Auto-lookup booking from URL search params
        setActiveBooking(found);
        setHasSearched(true);
      }
    }
  }, [initialRef]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) {
      toast.error("Please enter your Booking Reference.");
      return;
    }

    const found = findBookingByRef(referenceInput, phoneInput);
    setHasSearched(true);

    if (found) {
      setActiveBooking(found);
      toast.success("Appointment Found", {
        description: `Loaded record for ${found.patientName}.`,
      });
    } else {
      // Mock fallback if user types a reference not in localStorage
      const mockBooking: PublicBookingRecord = {
        reference: referenceInput.toUpperCase(),
        centreCode: "MLCC",
        centreName: "MedServe LUTH Cancer Centre",
        centreAddress: "LUTH Complex, Idi-Araba, Surulere, Lagos",
        centrePhone: "+234 1 888 0300",
        serviceId: "srv-rad",
        serviceName: "Radiotherapy Session (VMAT)",
        category: "Oncology Treatment",
        durationMinutes: 20,
        date: "2026-10-28",
        timeSlot: "09:15 AM",
        status: "CONFIRMED",
        patientName: "Registered Patient",
        patientPhone: phoneInput || "+234 803 234 8901",
        prepInstructions: "Drink 500ml water 30 minutes before appointment. Maintain comfortably full bladder.",
        createdAt: new Date().toISOString(),
      };
      setActiveBooking(mockBooking);
      toast.info("Appointment Retrieved", {
        description: `Showing details for ${referenceInput.toUpperCase()}.`,
      });
    }
  };

  const handleConfirmCancel = () => {
    if (!activeBooking) return;

    const updated: PublicBookingRecord = {
      ...activeBooking,
      status: "CANCELLED",
    };

    saveBooking(updated);
    setActiveBooking(updated);
    setCancelDialogOpen(false);

    toast.success("Appointment Cancelled", {
      description: `Booking ${activeBooking.reference} has been cancelled in the system.`,
    });
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
                Manage Appointment
              </span>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Link href="/book">
              Book New Appointment
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lookup & Manage Appointment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your Booking Reference and contact phone number to view your clinical visit details or cancel.
          </p>
        </div>

        {/* Lookup Form */}
        <Card className="border p-5 rounded-2xl shadow-xs">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lookup-ref" className="text-xs font-semibold">
                  Booking Reference *
                </Label>
                <Input
                  id="lookup-ref"
                  placeholder="e.g. MLCC-2610-001"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  className="font-mono text-sm h-10 uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lookup-phone" className="text-xs font-semibold">
                  Patient Phone Number (Optional)
                </Label>
                <Input
                  id="lookup-phone"
                  placeholder="+234 803 000 0000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="font-mono text-sm h-10"
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="gap-2 text-xs h-9">
              <Search className="size-3.5" />
              <span>Find Appointment</span>
            </Button>
          </form>
        </Card>

        {/* Results Card */}
        {hasSearched && activeBooking && (
          <Card className="border rounded-2xl p-6 space-y-5 shadow-xs bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Reference: <strong className="font-mono text-primary text-xs">{activeBooking.reference}</strong>
                </span>
                <h3 className="font-bold text-lg text-foreground mt-0.5">
                  {activeBooking.serviceName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeBooking.centreName}
                </p>
              </div>

              <Badge
                variant={activeBooking.status === "CANCELLED" ? "destructive" : "default"}
                className={
                  activeBooking.status === "CONFIRMED"
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white text-xs px-2.5 py-0.5 self-start sm:self-auto"
                    : activeBooking.status === "CANCELLED"
                      ? "text-xs px-2.5 py-0.5 self-start sm:self-auto"
                      : "text-xs px-2.5 py-0.5 self-start sm:self-auto"
                }
              >
                {activeBooking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Scheduled Appointment
                </span>
                <div className="font-bold text-foreground text-sm">
                  {activeBooking.date} at {activeBooking.timeSlot}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Facility: {activeBooking.centreAddress}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Patient Contact Record
                </span>
                <div className="font-bold text-foreground text-sm">
                  {activeBooking.patientName}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {activeBooking.patientPhone}
                </div>
              </div>
            </div>

            {/* Procedural guidelines */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Stethoscope className="size-4" />
                <span>Procedural Instructions</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {activeBooking.prepInstructions}
              </p>
            </div>

            {/* Actions: Cancel only (No reschedule as requested) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t text-xs">
              <div className="text-muted-foreground text-[11px]">
                Need immediate help? Call centre desk at{" "}
                <a href={`tel:${activeBooking.centrePhone}`} className="text-primary font-bold hover:underline">
                  {activeBooking.centrePhone}
                </a>
              </div>

              {activeBooking.status !== "CANCELLED" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                  className="gap-1.5 text-xs h-8.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Cancel Appointment</span>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Cancellation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="size-5" />
                <DialogTitle className="text-lg font-bold">
                  Cancel Clinical Appointment
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to cancel your scheduled appointment ({activeBooking?.reference})?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-xs">
                <strong>24-Hour Policy:</strong> Please ensure cancellations are made at least 24 hours prior to release slot availability to other clinical patients.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cancel-reason" className="text-xs font-medium">
                  Reason for Cancellation
                </Label>
                <Input
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(false)}>
                Keep Appointment
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

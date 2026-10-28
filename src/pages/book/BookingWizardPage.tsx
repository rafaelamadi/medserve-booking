"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
} from "@/shared/ui";
import {
  BOOKING_CENTRES,
  BOOKING_SERVICES,
  type BookingCentre,
  type BookingService,
  type PublicBookingRecord,
  saveBooking,
} from "@/entities/appointment";

const TIME_SLOTS = {
  morning: ["08:30 AM", "09:15 AM", "10:00 AM", "11:00 AM", "11:45 AM"],
  afternoon: ["01:00 PM", "01:45 PM", "02:30 PM", "03:15 PM", "04:00 PM"],
};

export default function BookingWizardPage() {
  const router = useRouter();

  // Wizard state: 1: Centre, 2: Service, 3: Date & Time, 4: Details, 5: Review
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);

  // Form selections
  const [selectedCentre, setSelectedCentre] = React.useState<BookingCentre>(BOOKING_CENTRES[0]);
  const [selectedService, setSelectedService] = React.useState<BookingService | null>(null);

  // Default date: tomorrow
  const [selectedDate, setSelectedDate] = React.useState("2026-10-28");
  const [selectedTime, setSelectedTime] = React.useState("09:15 AM");

  // Patient details
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("+234 ");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Available services for the chosen centre
  const availableServices = React.useMemo(() => {
    return BOOKING_SERVICES.filter((s) => s.centres.includes(selectedCentre.code));
  }, [selectedCentre]);

  // Handle service reset when centre changes
  const handleSelectCentre = (c: BookingCentre) => {
    setSelectedCentre(c);
    setSelectedService(null);
  };

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!selectedService) {
      toast.error("Please select a medical service or procedure to continue.");
      return;
    }
    setStep(3);
  };

  const handleStep3Next = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please pick a valid date and available time slot.");
      return;
    }
    setStep(4);
  };

  const handleStep4Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter patient's full legal name.");
      return;
    }
    if (!phone.trim() || phone.trim() === "+234") {
      toast.error("Please enter a valid contact phone number.");
      return;
    }
    if (!consent) {
      toast.error("Please check the consent box to proceed.");
      return;
    }
    setStep(5);
  };

  const handleFinalSubmit = () => {
    if (!selectedService) return;

    setIsSubmitting(true);

    const refNum = Math.floor(100 + Math.random() * 900);
    const reference = `${selectedCentre.code}-2610-${refNum}`;

    const newRecord: PublicBookingRecord = {
      reference,
      centreCode: selectedCentre.code,
      centreName: selectedCentre.name,
      centreAddress: selectedCentre.address,
      centrePhone: selectedCentre.phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      category: selectedService.categoryLabel,
      durationMinutes: selectedService.durationMinutes,
      date: selectedDate,
      timeSlot: selectedTime,
      status: selectedService.confirmationMode === "AUTO" ? "CONFIRMED" : "REQUESTED",
      patientName: fullName,
      patientPhone: phone,
      patientEmail: email || undefined,
      notes: notes || undefined,
      prepInstructions: selectedService.prepInstructions,
      createdAt: new Date().toISOString(),
    };

    saveBooking(newRecord);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Appointment Booked Successfully", {
        description: `Your booking reference is ${reference}. Routing to confirmation screen...`,
      });
      router.push(`/book/confirmed/${reference}`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Header with MedServe Branding & Direct Links */}
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
                Patient Self-Booking
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link href="/manage">
                <Search className="size-3.5" />
                Find My Booking
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/hub/login">
                Staff Hub
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Wizard Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Wizard Step Progress Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step} of 5</span>
            <span className="font-semibold text-foreground">
              {step === 1 && "Choose Centre"}
              {step === 2 && "Select Clinical Service"}
              {step === 3 && "Pick Date & Time Slot"}
              {step === 4 && "Patient Details"}
              {step === 5 && "Review & Submit"}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s < step
                    ? "bg-emerald-500"
                    : s === step
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: CHOOSE CENTRE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Select MedServe Centre
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the clinical or oncology centre nearest to you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BOOKING_CENTRES.map((centre) => {
                const isSelected = selectedCentre.id === centre.id;
                return (
                  <Card
                    key={centre.id}
                    onClick={() => handleSelectCentre(centre)}
                    className={`cursor-pointer transition-all border p-5 relative rounded-xl flex flex-col justify-between gap-4 ${
                      isSelected
                        ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                        : "hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            isSelected
                              ? "bg-primary text-primary-foreground border-transparent font-mono text-[10px]"
                              : "text-muted-foreground font-mono text-[10px]"
                          }
                        >
                          {centre.code}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {centre.city}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-base text-foreground leading-snug">
                        {centre.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {centre.tagline}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-[11px] text-muted-foreground">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{centre.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-primary shrink-0" />
                        <span className="font-mono">{centre.phone}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleStep1Next} className="gap-2 text-xs h-9">
                <span>Continue to Services</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE SERVICE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Select Clinical Service
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Procedures available at <strong className="text-foreground">{selectedCentre.name}</strong> ({selectedCentre.city}).
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Change Centre
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableServices.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <Card
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`cursor-pointer transition-all border p-5 relative rounded-xl flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                        : "hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {service.name}
                        </h3>
                        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 shrink-0 mt-0.5">
                          <Clock className="size-3 text-primary" />
                          {service.durationMinutes} mins
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2 text-xs h-9"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={!selectedService}
                className="gap-2 text-xs h-9"
              >
                <span>Continue to Date & Time</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PICK DATE & TIME SLOT */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Select Date & Time Slot
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Booking for <strong className="text-foreground">{selectedService?.name}</strong> at <strong className="text-foreground">{selectedCentre.name}</strong>.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Change Service
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date selection card */}
              <Card className="border p-5 rounded-xl space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="booking-date" className="text-xs font-semibold text-foreground">
                    Appointment Date *
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Weekdays only (closed on weekends & national holidays).
                  </p>
                </div>

                <Input
                  id="booking-date"
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-mono text-sm h-10"
                />

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">Selected Day</div>
                  <div>Wednesday, 28 October 2026</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Standard Operating Hours: 08:00 AM – 05:00 PM</div>
                </div>
              </Card>

              {/* Time slot picker */}
              <Card className="border p-5 rounded-xl md:col-span-2 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    Available Time Slots
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your preferred arrival slot for this procedure.
                  </p>
                </div>

                {/* Morning Slots */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Morning Sessions
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.morning.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all text-center ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                              : "bg-card hover:bg-muted/50 border-border/80 text-foreground"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div className="space-y-2 pt-2 border-t">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Afternoon Sessions
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.afternoon.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all text-center ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                              : "bg-card hover:bg-muted/50 border-border/80 text-foreground"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-2 text-xs h-9"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleStep3Next}
                className="gap-2 text-xs h-9"
              >
                <span>Continue to Patient Details</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PATIENT DETAILS */}
        {step === 4 && (
          <form onSubmit={handleStep4Next} className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Patient Contact Information
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Please provide patient details for identity registration and clinical SMS/Email confirmation.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(3)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Change Slot
              </Button>
            </div>

            <Card className="border p-6 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patient-name" className="text-xs font-semibold">
                  Full Legal Name *
                </Label>
                <Input
                  id="patient-name"
                  placeholder="e.g. Fatima Bello"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="patient-phone" className="text-xs font-semibold">
                    Phone Number (WhatsApp / Mobile) *
                  </Label>
                  <Input
                    id="patient-phone"
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-sm font-mono"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Required for official booking dispatch and clinic contact.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patient-email" className="text-xs font-semibold">
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="patient-email"
                    type="email"
                    placeholder="fatima.bello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used to receive appointment slips and clinical instructions.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient-notes" className="text-xs font-semibold">
                  Referral Doctor or Clinical Context (Optional)
                </Label>
                <Input
                  id="patient-notes"
                  placeholder="e.g. Referred by Dr. Adeleke from General Hospital; Histopathology report attached..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              {/* Consent checkbox */}
              <div className="pt-2 border-t flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(Boolean(checked))}
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I confirm that the patient information provided is accurate and consent to MedServe Oncology Network capturing contact details for scheduling, clinical care, and notification dispatches in accordance with NDPA regulations.
                </Label>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="gap-2 text-xs h-9"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                disabled={!consent || !fullName.trim() || !phone.trim()}
                className="gap-2 text-xs h-9"
              >
                <span>Review Booking</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && selectedService && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Review & Confirm Appointment
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Please verify your appointment summary before final submission.
              </p>
            </div>

            <Card className="border p-6 rounded-xl space-y-5 bg-card">
              {/* Centre & Procedure Summary */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Facility & Location
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-0.5">
                      {selectedCentre.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedCentre.address}</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs text-primary self-start sm:self-auto">
                    {selectedCentre.code}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Procedure / Service
                    </span>
                    <strong className="text-foreground text-sm">{selectedService.name}</strong>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Est. Duration: {selectedService.durationMinutes} minutes
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Scheduled Date & Time Slot
                    </span>
                    <strong className="text-foreground text-sm">{selectedDate} at {selectedTime}</strong>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      Arrival suggested 15 mins prior
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Contact Verification */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Registered Patient Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Full Name</span>
                    <span className="font-semibold text-foreground">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                    <span className="font-mono font-medium text-foreground">{phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email Address</span>
                    <span className="font-medium text-foreground">{email || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                disabled={isSubmitting}
                className="gap-2 text-xs h-9"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="gap-2 text-xs h-10 px-6 font-semibold shadow-sm"
              >
                <Check className="size-4" />
                <span>{isSubmitting ? "Submitting Booking..." : "Confirm & Complete Booking"}</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

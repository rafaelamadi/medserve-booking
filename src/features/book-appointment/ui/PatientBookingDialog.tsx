"use client";

import * as React from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
import {
  usePatientPortalStore,
  type RegisteredPatient,
} from "@/entities/patient";
import type { PatientVisit } from "@/shared/types";
import { createStaffAppointmentServer } from "@/server/appointments";

interface PatientBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: RegisteredPatient;
  defaultCentreCode?: "MLCC" | "MKDC" | "MUDC";
  onBookingSuccess?: (newBooking: PublicBookingRecord) => void;
  /** Called after booking succeeds, with the patient's real Supabase ID, so the parent can re-fetch live data */
  onBookingComplete?: (patientId: string) => void;
}

const TIME_SLOTS = {
  morning: ["08:30 AM", "09:15 AM", "10:00 AM", "11:00 AM", "11:45 AM"],
  afternoon: ["01:00 PM", "01:45 PM", "02:30 PM", "03:15 PM", "04:00 PM"],
};

export function PatientBookingDialog({
  open,
  onOpenChange,
  patient,
  defaultCentreCode = "MLCC",
  onBookingSuccess,
  onBookingComplete,
}: PatientBookingDialogProps) {
  const { addCustomVisit, setCalendarFocusDate } = usePatientPortalStore();

  // Wizard step: 1: Centre, 2: Service, 3: Date & Time, 4: Details, 5: Review
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);

  // Form selections
  const initialCentre = React.useMemo(() => {
    return BOOKING_CENTRES.find((c) => c.code === defaultCentreCode) || BOOKING_CENTRES[0];
  }, [defaultCentreCode]);

  const [selectedCentre, setSelectedCentre] = React.useState<BookingCentre>(initialCentre);
  const [selectedService, setSelectedService] = React.useState<BookingService | null>(null);

  // Default date: tomorrow
  const [selectedDate, setSelectedDate] = React.useState("2026-10-28");
  const [selectedTime, setSelectedTime] = React.useState("09:15 AM");

  // Patient details (pre-filled with logged-in patient dossier)
  const [fullName, setFullName] = React.useState(patient.fullName);
  const [phone, setPhone] = React.useState(patient.phone);
  const [email, setEmail] = React.useState(patient.email || "");
  const [notes, setNotes] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmedBooking, setConfirmedBooking] = React.useState<PublicBookingRecord | null>(null);

  // Available services for the chosen centre
  const availableServices = React.useMemo(() => {
    return BOOKING_SERVICES.filter((s) => s.centres.includes(selectedCentre.code));
  }, [selectedCentre]);

  // Reset or initialize state whenever modal opens
  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset modal form state when opened
      setStep(1);
      setSelectedCentre(initialCentre);
      setSelectedService(null);
      setSelectedDate("2026-10-28");
      setSelectedTime("09:15 AM");
      setFullName(patient.fullName);
      setPhone(patient.phone);
      setEmail(patient.email || "");
      setNotes("");
      setConsent(false);
      setIsSubmitting(false);
      setConfirmedBooking(null);
    }
  }, [open, initialCentre, patient]);

  // Centre change handler
  const handleSelectCentre = (c: BookingCentre) => {
    setSelectedCentre(c);
    setSelectedService(null);
  };

  // Step transitions
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
    if (!phone.trim()) {
      toast.error("Please enter a valid contact phone number.");
      return;
    }
    if (!consent) {
      toast.error("Please check the consent box to proceed.");
      return;
    }
    setStep(5);
  };

  const handleFinalSubmit = async () => {
    if (!selectedService) return;

    setIsSubmitting(true);

    let reference = `${selectedCentre.code}-2610-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const result = await createStaffAppointmentServer({
        patientId: patient.id,   // Pass the real Supabase CUID — no fuzzy matching
        patientName: fullName,
        patientPhone: phone,
        patientEmail: email || undefined,
        patientMrn: patient.mrn,
        centreCode: (selectedCentre.code as "MLCC" | "MKDC" | "MUDC") || "MLCC",
        serviceName: selectedService.name,
        date: selectedDate,
        timeSlot: selectedTime,
        notes: notes || undefined,
        source: "WEB",
      });

      if (result.ok && result.reference) {
        reference = result.reference;
      } else {
        toast.error("Booking Error", {
          description: result.error || "Unable to confirm appointment with the clinical centre.",
        });
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Failed to persist appointment to Supabase:", err);
      toast.error("Booking Failed", {
        description: "An unexpected error occurred while communicating with the server.",
      });
      setIsSubmitting(false);
      return;
    }

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

    const newVisit: PatientVisit = {
      id: `vis-bkg-${reference}`,
      date: selectedDate,
      timeSlot: selectedTime,
      serviceName: selectedService.name,
      room: "Consulting Room",
      status: "SCHEDULED",
      notes: notes ? `${notes} (${reference})` : `Booked appointment #${reference}`,
    };

    saveBooking(newRecord);
    addCustomVisit(newVisit);

    // Notify other components & staff queue in real time
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("medserve:appointment-sync"));
    }

    setIsSubmitting(false);
    setConfirmedBooking(newRecord);

    if (onBookingSuccess) {
      onBookingSuccess(newRecord);
    }

    // Trigger parent re-fetch so the calendar/ledger updates immediately
    if (onBookingComplete) {
      onBookingComplete(patient.id);
    }

    toast.success("Appointment Booked Successfully", {
      description: `Booking #${reference} confirmed for ${selectedDate} at ${selectedTime}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden border rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {!confirmedBooking ? (
          <>
            {/* Modal Header: Title, Pre-filled Badge, & Step Progress Bar */}
            <div className="p-6 border-b bg-muted/20 space-y-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                      Book Clinical Appointment
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Schedule a clinical consultation, therapy session, or diagnostic procedure.
                    </DialogDescription>
                  </div>
                </div>

                {/* Pre-filled Patient Dossier Pill */}
                <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-xl text-xs font-medium self-start sm:self-auto">
                  <User className="size-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{patient.fullName}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">({patient.mrn})</span>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Wizard Step Progress Indicator */}
              <div className="space-y-2 pt-1">
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
            </div>

            {/* Scrollable Wizard Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* STEP 1: CHOOSE CENTRE */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Select MedServe Centre
                    </h2>
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

                  <div className="flex justify-end pt-4 border-t">
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
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Select Clinical Service
                      </h2>
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

                  <div className="flex items-center justify-between pt-4 border-t">
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
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Select Date & Time Slot
                      </h2>
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
                        <Label htmlFor="booking-date-modal" className="text-xs font-semibold text-foreground">
                          Appointment Date *
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Weekdays only (closed on weekends & public holidays).
                        </p>
                      </div>

                      <Input
                        id="booking-date-modal"
                        type="date"
                        value={selectedDate}
                        min="2026-10-27"
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="font-mono text-sm h-10"
                      />

                      <div className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">Selected Day</div>
                        <div>Wednesday, 28 October 2026</div>
                        <div className="text-[11px] text-emerald-600 font-medium">Standard Hours: 08:00 AM – 05:00 PM</div>
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

                  <div className="flex items-center justify-between pt-4 border-t">
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
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Patient Contact Information
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pre-filled from your registered patient profile. Update if necessary.
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
                      <Label htmlFor="modal-patient-name" className="text-xs font-semibold">
                        Full Legal Name *
                      </Label>
                      <Input
                        id="modal-patient-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-patient-phone" className="text-xs font-semibold">
                          Phone Number (WhatsApp / Mobile) *
                        </Label>
                        <Input
                          id="modal-patient-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-10 text-sm font-mono"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Used for appointment confirmation and clinical updates.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="modal-patient-email" className="text-xs font-semibold">
                          Email Address (Optional)
                        </Label>
                        <Input
                          id="modal-patient-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Used to receive appointment passes and preparation guidelines.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="modal-patient-notes" className="text-xs font-semibold">
                        Referral Doctor or Clinical Context (Optional)
                      </Label>
                      <Input
                        id="modal-patient-notes"
                        placeholder="e.g. Clinical review before next treatment session..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Consent checkbox */}
                    <div className="pt-2 border-t flex items-start gap-3">
                      <Checkbox
                        id="modal-consent"
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(Boolean(checked))}
                        className="mt-0.5"
                      />
                      <Label htmlFor="modal-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        I confirm that the patient information provided is accurate and consent to MedServe Oncology Network capturing contact details for scheduling, clinical care, and notification dispatches in accordance with NDPA regulations.
                      </Label>
                    </div>
                  </Card>

                  <div className="flex items-center justify-between pt-4 border-t">
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
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Review & Confirm Appointment
                    </h2>
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
                            Centre & Location
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

                  <div className="flex items-center justify-between pt-4 border-t">
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
            </div>
          </>
        ) : (
          /* Confirmation Ticket Screen inside Modal */
          <div className="p-8 sm:p-12 space-y-6 text-center flex-1 overflow-y-auto">
            <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-extrabold text-foreground">
                Appointment Confirmed!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                Your clinical appointment has been booked and appended to your active treatment ledger.
              </DialogDescription>
            </div>

            {/* Ticket Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl border bg-muted/20 text-left text-xs space-y-2.5 shadow-2xs">
              <div className="flex justify-between py-1.5 border-b border-dashed">
                <span className="text-muted-foreground">Booking Reference:</span>
                <span className="font-bold text-foreground font-mono text-sm text-primary">
                  {confirmedBooking.reference}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-semibold text-foreground">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold text-foreground font-mono">
                  {confirmedBooking.date} at {confirmedBooking.timeSlot}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed">
                <span className="text-muted-foreground">Centre:</span>
                <span className="font-semibold text-foreground">{confirmedBooking.centreName}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">{confirmedBooking.patientName}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              A confirmation notice has been dispatched to {confirmedBooking.patientPhone}. Please arrive 15 minutes prior for check-in and vitals verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-md mx-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs font-semibold h-10"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="w-full text-xs font-semibold h-10 gap-2"
                onClick={() => {
                  setCalendarFocusDate(confirmedBooking.date);
                  onOpenChange(false);
                }}
              >
                <Calendar className="size-4" />
                View in Calendar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

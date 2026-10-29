"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  User,
  ShieldCheck,
  Phone,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sendPatientEmailOtp, verifyPatientEmailOtp } from "@/features/patient-auth";
import { usePatientPortalStore, REGISTERED_PATIENTS } from "@/entities/patient";
import { completePatientOnboardingServer, getLivePatientByEmailServer } from "@/server/patients";

const emailStepSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type EmailStepValues = z.infer<typeof emailStepSchema>;

const NIGERIAN_STATES = [
  "Lagos State",
  "Federal Capital Territory (Abuja)",
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Ebonyi State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
];

export function PatientLoginForm() {
  const router = useRouter();
  const { setPatient } = usePatientPortalStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"email" | "otp" | "intake">("email");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [activeFullName, setActiveFullName] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Demographic Intake State (Step 3: Registration Onboarding)
  const [intakeFullName, setIntakeFullName] = useState("");
  const [intakePhone, setIntakePhone] = useState("+234 ");
  const [intakeGender, setIntakeGender] = useState<"Female" | "Male" | "">("");
  const [intakeAge, setIntakeAge] = useState<string>("");
  const [intakeState, setIntakeState] = useState<string>("Lagos State");
  const [intakeAddress, setIntakeAddress] = useState("");
  const [intakeLoading, setIntakeLoading] = useState(false);

  const form = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function handleGoogleAuth() {
    setGoogleLoading(true);
    try {
      const res = await signIn("google", {
        callbackUrl: "/dashboard/portal",
        redirect: false,
      });

      if (res?.error) {
        toast.info("Google OAuth notice", {
          description: "Google credentials are not configured in this environment. Please sign in with your email below.",
        });
      } else if (res?.url) {
        router.push(res.url);
      }
    } catch {
      toast.info("Google OAuth notice", {
        description: "Google credentials are not configured in this environment. Please sign in with your email below.",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSendOtp(data: EmailStepValues) {
    setLoading(true);
    const email = data.email.trim();
    const fullName = data.fullName?.trim();

    try {
      const res = await sendPatientEmailOtp({
        email,
        fullName,
        isSignUp: mode === "signup",
      });

      if (!res.ok) {
        toast.error("Unable to send code", {
          description: res.error,
        });

        if (res.requiresSignup) {
          setMode("signup");
        } else if (res.requiresSignin) {
          setMode("signin");
        }
        return;
      }

      setActiveEmail(email);
      if (fullName) setActiveFullName(fullName);
      setStep("otp");
      setOtp("");
      setResendCooldown(60);

      toast.success("Verification code sent!", {
        description: `We've sent a 6-digit code to ${email}`,
      });

      if (res.devCode) {
        toast.info(`Dev Access Code: ${res.devCode}`, {
          duration: 10000,
        });
      }
    } catch {
      toast.error("Error sending code", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(codeToVerify = otp) {
    if (codeToVerify.length !== 6) {
      toast.error("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPatientEmailOtp({
        email: activeEmail,
        code: codeToVerify,
        fullName: activeFullName || undefined,
        isSignUp: mode === "signup",
      });

      if (!res.ok) {
        toast.error("Verification failed", {
          description: res.error,
        });
        setOtp("");
        return;
      }

      // If user came through Sign Up flow, advance to Step 3: Intake Form!
      if (mode === "signup") {
        setStep("intake");
        setIntakeFullName(activeFullName || res.patient.fullName || "");
        toast.success("Email verified!", {
          description: "Please complete your patient clinical intake details.",
        });
        return;
      }

      // Sign In Flow: load live patient from Supabase
      try {
        const livePatient = await getLivePatientByEmailServer(activeEmail);
        if (livePatient) {
          setPatient(livePatient);
        } else {
          const registeredMatch = REGISTERED_PATIENTS.find(
            (p) =>
              p.email.toLowerCase() === activeEmail.toLowerCase() ||
              p.fullName.toLowerCase() === res.patient.fullName.toLowerCase(),
          );
          if (registeredMatch) {
            setPatient(registeredMatch);
          } else {
            setPatient({
              id: res.patient.id,
              mrn: `MS-${Math.floor(100000 + Math.random() * 900000)}`,
              fullName: res.patient.fullName,
              gender: undefined,
              age: undefined,
              phone: "",
              email: res.patient.email,
              address: undefined,
              state: undefined,
              centreCode: "MLCC",
              centreName: "MedServe Medical Centre",
              primaryDiagnosis: "General Clinical Record",
              primaryService: "Outpatient Care",
              doctorInCharge: "Dr. Kachi",
              status: "ACTIVE",
              registrationDate: new Date().toISOString().split("T")[0],
              totalVisits: 0,
              completedVisits: 0,
              remainingVisits: 0,
              visits: [],
              commLogs: [],
            });
          }
        }
      } catch (err) {
        console.error("Error retrieving live patient:", err);
      }

      toast.success("Authentication successful!", {
        description: `Welcome back, ${res.patient.fullName}. Redirecting to your care portal...`,
      });

      router.push("/dashboard/portal");
      router.refresh();
    } catch {
      toast.error("Error verifying code", {
        description: "An unexpected error occurred during verification.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteIntake(e: React.FormEvent) {
    e.preventDefault();

    const fullName = intakeFullName.trim();
    const phone = intakePhone.trim();

    if (!fullName) {
      toast.error("Full Legal Name is required.");
      return;
    }

    if (!phone || phone === "+234" || phone === "+234 ") {
      toast.error("Phone number is required.");
      return;
    }

    const ageNum = intakeAge ? Number(intakeAge) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
      toast.error("Please enter a valid age between 1 and 120.");
      return;
    }

    setIntakeLoading(true);
    try {
      const res = await completePatientOnboardingServer({
        email: activeEmail,
        fullName,
        phone,
        gender: intakeGender === "Male" || intakeGender === "Female" ? intakeGender : undefined,
        age: ageNum,
        state: intakeState || undefined,
        address: intakeAddress.trim() || undefined,
      });

      if (!res.success || !res.patient) {
        toast.error("Registration Failed", {
          description: res.error || "Could not complete onboarding. Please try again.",
        });
        return;
      }

      // Sync active patient with the portal store
      setPatient(res.patient);

      // Dispatch global sync events across the entire dashboard
      window.dispatchEvent(new CustomEvent("medserve:patient-sync"));
      window.dispatchEvent(new CustomEvent("medserve:appointment-sync"));
      try {
        window.localStorage.setItem("medserve:last-sync", Date.now().toString());
      } catch {
        // ignore
      }

      toast.success("Registration Complete!", {
        description: `Welcome to MedServe, ${res.patient.fullName}. Your MRN is ${res.patient.mrn}. Redirecting...`,
      });

      router.push("/dashboard/portal");
      router.refresh();
    } catch (err) {
      console.error("Intake submission error:", err);
      toast.error("An unexpected error occurred while completing registration.");
    } finally {
      setIntakeLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || !activeEmail) return;
    setLoading(true);
    try {
      const res = await sendPatientEmailOtp({
        email: activeEmail,
        fullName: activeFullName || undefined,
        isSignUp: mode === "signup",
      });

      if (!res.ok) {
        toast.error("Resend failed", { description: res.error });
        return;
      }

      setResendCooldown(60);
      toast.success("New code sent!", {
        description: `A fresh 6-digit code has been delivered to ${activeEmail}`,
      });

      if (res.devCode) {
        toast.info(`Dev Access Code: ${res.devCode}`, {
          duration: 10000,
        });
      }
    } catch {
      toast.error("Could not resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sign In vs Sign Up Sub-toggle (Hidden during intake form) */}
      {step !== "intake" && (
        <div className="flex p-1 bg-muted/60 rounded-xl border border-border/40 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setStep("email");
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mode === "signin"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setStep("email");
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mode === "signup"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>
      )}

      {step === "email" ? (
        <div className="flex flex-col gap-4">
          {/* Continue with Google button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full relative flex items-center justify-center gap-3 border-border/80 bg-background hover:bg-muted/40 font-medium"
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{mode === "signin" ? "Continue with Google" : "Sign up with Google"}</span>
          </Button>

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                {mode === "signin" ? "or continue with email" : "or sign up with email"}
              </span>
            </div>
          </div>

          {/* Email form */}
          <form noValidate onSubmit={form.handleSubmit(onSendOtp)} className="flex flex-col gap-4">
            <FieldGroup className="gap-4">
              {mode === "signup" && (
                <Controller
                  control={form.control}
                  name="fullName"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-fullname" className="text-sm font-medium">
                        Full Name <span className="text-muted-foreground font-normal">(optional)</span>
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="patient-fullname"
                          type="text"
                          size="lg"
                          placeholder="e.g. Fatima Bello"
                          autoComplete="name"
                          aria-invalid={fieldState.invalid}
                          className="pr-10"
                        />
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="patient-email" className="text-sm font-medium">
                      Patient Email Address
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="patient-email"
                        type="email"
                        size="lg"
                        placeholder="patient@example.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button className="w-full mt-2" size="lg" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending code...
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-1">
              {mode === "signin"
                ? "No password required. We'll send a secure one-time code to your email."
                : "Enter your email to receive a secure 6-digit verification code."}
            </p>
          </form>
        </div>
      ) : step === "otp" ? (
        /* Step 2: OTP Verification */
        <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
          <button
            type="button"
            onClick={() => setStep("email")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Change email</span>
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold text-base">
              <ShieldCheck className="size-5 text-emerald-600" />
              <span>Enter verification code</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We sent a 6-digit one-time code to <strong className="text-foreground">{activeEmail}</strong>. Enter it below to verify your identity.
            </p>
          </div>

          <div className="py-2 flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (val.length === 6) {
                  handleVerifyOtp(val);
                }
              }}
              disabled={loading}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="size-11 rounded-lg text-base font-semibold border-input" />
                <InputOTPSlot index={1} className="size-11 rounded-lg text-base font-semibold border-input" />
                <InputOTPSlot index={2} className="size-11 rounded-lg text-base font-semibold border-input" />
                <InputOTPSlot index={3} className="size-11 rounded-lg text-base font-semibold border-input" />
                <InputOTPSlot index={4} className="size-11 rounded-lg text-base font-semibold border-input" />
                <InputOTPSlot index={5} className="size-11 rounded-lg text-base font-semibold border-input" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full"
            size="lg"
            type="button"
            onClick={() => handleVerifyOtp()}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying code...
              </>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {mode === "signup" ? "Verify & Continue" : "Verify & Enter Portal"}
              </span>
            )}
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
            {resendCooldown > 0 ? (
              <span className="text-muted-foreground font-mono">
                Resend in 0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="size-3" />
                Resend Code
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Step 3: Patient Demographic Intake (Sign Up Flow) */
        <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold text-base">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                <UserCheck className="size-5" />
              </div>
              <span>Complete Patient Profile</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please provide your clinical intake details below to finalize your MedServe registration.
            </p>
          </div>

          <form onSubmit={handleCompleteIntake} className="flex flex-col gap-4">
            {/* Verified Email Field (Read-only, Locked with badge) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="intake-email" className="text-xs font-medium text-foreground">
                  Email Address
                </Label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3" />
                  Verified via OTP
                </span>
              </div>
              <div className="relative">
                <Input
                  id="intake-email"
                  type="email"
                  value={activeEmail}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed pr-10 text-xs font-mono font-medium text-foreground"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Full Legal Name */}
            <div className="space-y-1.5">
              <Label htmlFor="intake-fullname" className="text-xs font-medium text-foreground">
                Full Legal Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="intake-fullname"
                  type="text"
                  placeholder="e.g. Fatima Bello"
                  value={intakeFullName}
                  onChange={(e) => setIntakeFullName(e.target.value)}
                  required
                  className="pr-10 text-xs"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Phone Number & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="intake-phone" className="text-xs font-medium text-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="intake-phone"
                    type="tel"
                    placeholder="+234 803 000 0000"
                    value={intakePhone}
                    onChange={(e) => setIntakePhone(e.target.value)}
                    required
                    className="pr-10 text-xs"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intake-age" className="text-xs font-medium text-foreground">
                  Age (Years) <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="intake-age"
                  type="number"
                  min={1}
                  max={120}
                  placeholder="e.g. 42"
                  value={intakeAge}
                  onChange={(e) => setIntakeAge(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Biological Sex & State of Residence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="intake-gender" className="text-xs font-medium text-foreground">
                  Biological Sex
                </Label>
                <select
                  id="intake-gender"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={intakeGender}
                  onChange={(e) => setIntakeGender(e.target.value as "Female" | "Male" | "")}
                >
                  <option value="">Select Biological Sex</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intake-state" className="text-xs font-medium text-foreground">
                  State of Residence
                </Label>
                <select
                  id="intake-state"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={intakeState}
                  onChange={(e) => setIntakeState(e.target.value)}
                >
                  {NIGERIAN_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-1.5">
              <Label htmlFor="intake-address" className="text-xs font-medium text-foreground">
                Residential Address <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="intake-address"
                type="text"
                placeholder="e.g. 15 Gana Street, Maitama, Abuja"
                value={intakeAddress}
                onChange={(e) => setIntakeAddress(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full mt-2"
              size="lg"
              type="submit"
              disabled={intakeLoading}
            >
              {intakeLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Finalizing Registration...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Complete Registration & Enter Care Portal
                </span>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              An official Medical Record Number (MRN) will be automatically generated and assigned upon completion.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

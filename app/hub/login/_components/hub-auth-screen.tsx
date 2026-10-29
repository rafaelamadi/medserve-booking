"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, ShieldCheck, HeartPulse, UserCog, User, UserCheck } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HubLoginForm } from "./hub-login-form";
import { PatientLoginForm } from "./patient-login-form";
import { StaffActivationForm } from "./staff-activation-form";

export function HubAuthScreen() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode");
  const emailParam = searchParams?.get("email") || "";
  const mfaParam = searchParams?.get("mfa") || "";

  const tabParam = searchParams?.get("tab");
  const stepParam = searchParams?.get("step");

  const isActivateMode = mode === "activate" || (Boolean(emailParam) && Boolean(mfaParam));
  const isIntakeMode = stepParam === "intake";

  const [activeTab, setActiveTab] = useState<"staff" | "patient">(() => {
    if (tabParam === "patient" || isIntakeMode) return "patient";
    return "staff";
  });

  return (
    <div className="flex h-dvh">
      {/* Left split screen - Branded hero panel */}
      <div className="bg-primary hidden lg:block lg:w-1/3 transition-colors duration-500">
        <div className="flex h-full flex-col items-center justify-between p-12 text-center">
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <Activity className="size-6 text-primary-foreground" />
            <span className="font-semibold tracking-wide text-lg">MedServe Hub</span>
          </div>

          <div className="space-y-6 max-w-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm ring-1 ring-primary-foreground/20 transition-all duration-300">
              {isActivateMode ? (
                <ShieldCheck className="text-primary-foreground size-8" />
              ) : isIntakeMode ? (
                <UserCheck className="text-primary-foreground size-8" />
              ) : activeTab === "staff" ? (
                <ShieldCheck className="text-primary-foreground size-8" />
              ) : (
                <HeartPulse className="text-primary-foreground size-8" />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-4xl font-light tracking-tight">
                {isActivateMode
                  ? "Staff Onboarding"
                  : isIntakeMode
                  ? "Patient Registration"
                  : activeTab === "staff"
                  ? "Clinician & Staff Hub"
                  : "Patient Home"}
              </h1>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                {isActivateMode
                  ? "Welcome to the MedServe Oncology Network. Complete your clinical account activation and set your permanent password."
                  : isIntakeMode
                  ? "Welcome to MedServe. Complete your clinical demographic profile to activate your official medical record and access your care portal."
                  : activeTab === "staff"
                  ? "Single sign-on access to oncology appointments, radiotherapy series, and patient queue management across MLCC, MKDC, and MUDC centres."
                  : "View upcoming treatment sessions, verified encounter history, and appointment management across all MedServe cancer centres."}
              </p>
            </div>
          </div>

          <div className="text-primary-foreground/60 text-xs">
            MedServe Oncology Network &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Right split screen - Clean authentication panel */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8 lg:py-12">
          {isActivateMode ? (
            /* Dedicated First-Time Staff Activation Flow */
            <StaffActivationForm initialEmail={emailParam} initialMfa={mfaParam} />
          ) : isIntakeMode ? (
            /* Dedicated Patient Clinical Intake Flow (Tabs removed during patient confirmation) */
            <PatientLoginForm />
          ) : (
            /* Standard Role switcher tab */
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "staff" | "patient")}
              className="w-full"
            >
              <TabsList size="lg" className="grid w-full grid-cols-2 bg-muted/80 rounded-xl">
                <TabsTrigger
                  value="staff"
                  className="flex items-center justify-center gap-2 font-medium text-sm py-2 data-active:bg-background data-active:shadow-sm rounded-lg"
                >
                  <UserCog className="size-4" />
                  Staff
                </TabsTrigger>
                <TabsTrigger
                  value="patient"
                  className="flex items-center justify-center gap-2 font-medium text-sm py-2 data-active:bg-background data-active:shadow-sm rounded-lg"
                >
                  <User className="size-4" />
                  Patient
                </TabsTrigger>
              </TabsList>

              {/* Staff tab content */}
              <TabsContent value="staff" className="space-y-6 mt-6">
                <div className="space-y-1.5 text-center lg:text-left">
                  <div className="text-2xl font-semibold tracking-tight">Staff Portal</div>
                  <p className="text-muted-foreground text-sm">
                    Sign in or create your staff account to access appointments and clinical queues.
                  </p>
                </div>

                <HubLoginForm />
              </TabsContent>

              {/* Patient tab content */}
              <TabsContent value="patient" className="space-y-6 mt-6">
                <div className="space-y-1.5 text-center lg:text-left">
                  <div className="text-2xl font-semibold tracking-tight">Patient Care Portal</div>
                  <p className="text-muted-foreground text-sm">
                    Sign in or register to access your personalized care plan and upcoming visits.
                  </p>
                </div>

                <PatientLoginForm />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateStaffAccountServer,
  getStaffInviteDetailsServer,
} from "@/server/staff";

interface StaffActivationFormProps {
  initialEmail?: string;
  initialMfa?: string;
}

export function StaffActivationForm({
  initialEmail = "",
  initialMfa = "",
}: StaffActivationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams?.get("email") || initialEmail;
  const mfaParam = searchParams?.get("mfa") || initialMfa;

  const [email] = useState(emailParam);
  const [mfaCode, setMfaCode] = useState(mfaParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{
    name: string;
    email: string;
    role: string;
    centreName: string;
    isPending: boolean;
  } | null>(null);

  useEffect(() => {
    if (email) {
      getStaffInviteDetailsServer(email).then((res) => {
        if (res.success && res.staff) {
          setStaffInfo(res.staff);
        }
      });
    }
  }, [email]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Staff email is missing from the activation link.");
      return;
    }

    if (!mfaCode.trim()) {
      toast.error("Please enter the MFA code sent to your email.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please check and re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await activateStaffAccountServer({
        email,
        password,
        mfaCode: mfaCode.trim(),
      });

      if (!res.success || !res.staff) {
        toast.error("Activation Failed", {
          description: res.error || "Could not activate your account. Please try again.",
        });
        return;
      }

      toast.success("Account Activated!", {
        description: `Welcome, ${res.staff.fullName}. Signing you into MedServe...`,
      });

      // Automatically authenticate the newly activated staff member
      const authRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (authRes?.error) {
        toast.info("Password set successfully. Please sign in with your new credentials.");
        router.push("/hub/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Staff activation error:", err);
      toast.error("An unexpected error occurred during account activation.");
    } finally {
      setLoading(false);
    }
  }

  if (staffInfo && !staffInfo.isPending) {
    return (
      <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
              <CheckCircle2 className="size-5" />
            </div>
            <span>Account Already Activated</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hello <strong className="text-foreground">{staffInfo.name}</strong>, your account for{" "}
            <strong className="text-foreground">{staffInfo.email}</strong> has already been activated. You can sign in using your existing password.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push("/hub/login")}
        >
          Proceed to Staff Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
            <ShieldCheck className="size-5" />
          </div>
          <span>Activate Staff Account</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {staffInfo ? (
            <>
              Welcome, <strong className="text-foreground">{staffInfo.name}</strong>. You have been assigned as{" "}
              <strong className="text-foreground">{staffInfo.role}</strong> at{" "}
              <strong className="text-foreground">{staffInfo.centreName}</strong>. Please set your permanent password to complete activation.
            </>
          ) : (
            "Please confirm your credentials and choose a secure permanent password to activate your clinician account."
          )}
        </p>
      </div>

      <form onSubmit={handleActivate} className="flex flex-col gap-4">
        {/* Full Legal Name (Pre-filled and Locked) */}
        {staffInfo && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Clinician Name</Label>
            <div className="relative">
              <Input
                value={staffInfo.name}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed pr-10 text-xs font-medium text-foreground"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        {/* Staff Email (Pre-filled, Locked with Badge) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground">Staff Email Address</Label>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" />
              Verified Invitation
            </span>
          </div>
          <div className="relative">
            <Input
              type="email"
              value={email}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed pr-10 text-xs font-mono font-medium text-foreground"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* One-Time MFA Enrollment Code */}
        <div className="space-y-1.5">
          <Label htmlFor="activate-mfa" className="text-xs font-medium text-foreground">
            One-Time MFA Enrollment Code <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="activate-mfa"
              type="text"
              placeholder="e.g. MFA-1477"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
              required
              className="pr-10 text-xs font-mono font-semibold tracking-wider uppercase text-foreground"
            />
            <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            This code was included in your invitation email to confirm your enrollment identity.
          </p>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="activate-password" className="text-xs font-medium text-foreground">
            Set Permanent Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="activate-password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="activate-confirm-password" className="text-xs font-medium text-foreground">
            Confirm Permanent Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="activate-confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="text-xs"
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full mt-2"
          size="lg"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Activating Clinical Account...
            </>
          ) : (
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Activate Account & Enter Clinician Hub
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}

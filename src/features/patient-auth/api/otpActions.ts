"use server";

import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/shared/api/prisma";
import { sendOtpEmail } from "@/shared/lib/email";
import { setPatientSession } from "@/shared/lib/patientCookie";
import { generateOtpCode, hashOtpCode } from "@/features/verify-phone-otp/lib/otpCrypto";

const emailSchema = z.string().email("Please enter a valid email address.");

export type SendOtpResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string; requiresSignup?: boolean; requiresSignin?: boolean };

export type VerifyOtpResult =
  | { ok: true; patient: { id: string; fullName: string; email: string } }
  | { ok: false; error: string };

/**
 * Sends a 6-digit verification code to the patient's email.
 */
export async function sendPatientEmailOtp(params: {
  email: string;
  fullName?: string;
  isSignUp: boolean;
}): Promise<SendOtpResult> {
  try {
    const parsedEmail = emailSchema.safeParse(params.email.trim());
    if (!parsedEmail.success) {
      return { ok: false, error: parsedEmail.error.issues[0]?.message || "Invalid email" };
    }

    const email = parsedEmail.data.toLowerCase();

    // Check existing patient registration
    const existingPatient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!params.isSignUp && !existingPatient) {
      return {
        ok: false,
        error: "No patient account found with this email. Please switch to Sign Up to create an account.",
        requiresSignup: true,
      };
    }

    if (params.isSignUp && existingPatient) {
      return {
        ok: false,
        error: "An account already exists with this email. Please switch to Sign In.",
        requiresSignin: true,
      };
    }

    // Cooldown check (prevent rapid resends within 30 seconds)
    const recentOtp = await prisma.emailOtp.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 30_000) {
      return {
        ok: false,
        error: "A verification code was just sent. Please check your inbox or wait 30 seconds before requesting another.",
      };
    }

    // Generate fresh 6-digit code
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000); // 10 minutes

    // Delete any stale OTPs for this email and store the fresh one
    await prisma.emailOtp.deleteMany({ where: { email } });
    await prisma.emailOtp.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    // Send the email via Resend
    const recipientName = params.fullName || existingPatient?.fullName;
    const emailResult = await sendOtpEmail(email, code, recipientName);

    if (!emailResult.success) {
      return { ok: false, error: emailResult.error || "Failed to deliver email" };
    }

    const isDev = process.env.NODE_ENV !== "production";
    return {
      ok: true,
      devCode: isDev ? code : undefined,
    };
  } catch (err) {
    console.error("[sendPatientEmailOtp] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate verification code",
    };
  }
}

/**
 * Validates the 6-digit OTP, updates/creates the Patient record, and sets the secure session cookie.
 */
export async function verifyPatientEmailOtp(params: {
  email: string;
  code: string;
  fullName?: string;
  isSignUp: boolean;
}): Promise<VerifyOtpResult> {
  try {
    const parsedEmail = emailSchema.safeParse(params.email.trim());
    if (!parsedEmail.success) {
      return { ok: false, error: "Invalid email address" };
    }

    const email = parsedEmail.data.toLowerCase();
    const cleanCode = params.code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      return { ok: false, error: "Please enter a valid 6-digit code." };
    }

    const otpRecord = await prisma.emailOtp.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return { ok: false, error: "Verification code expired or not found. Please request a new code." };
    }

    if (otpRecord.attempts >= 5) {
      await prisma.emailOtp.delete({ where: { id: otpRecord.id } });
      return { ok: false, error: "Too many failed attempts. Please request a fresh code." };
    }

    // Verify hash using timing-safe comparison
    const incomingHash = hashOtpCode(cleanCode);
    const isMatch = timingSafeEqual(
      Buffer.from(incomingHash, "hex"),
      Buffer.from(otpRecord.codeHash, "hex"),
    );

    if (!isMatch) {
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "Invalid verification code. Please check and try again." };
    }

    // Code verified! Delete OTP
    await prisma.emailOtp.delete({ where: { id: otpRecord.id } });

    // Find or create patient record
    let patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          email,
          fullName: params.fullName?.trim() || "Patient",
        },
      });
    } else if (params.fullName && !patient.fullName) {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { fullName: params.fullName.trim() },
      });
    }

    // Seal session cookie
    await setPatientSession({
      patientId: patient.id,
      email: patient.email ?? email,
      name: patient.fullName,
      phone: patient.phone ?? undefined,
    });

    return {
      ok: true,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email ?? email,
      },
    };
  } catch (err) {
    console.error("[verifyPatientEmailOtp] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }
}

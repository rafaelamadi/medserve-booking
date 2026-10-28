"use server";

import { headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { sendSms } from "@/entities/notification/lib/senders";
import { prisma } from "@/shared/api/prisma";
import { normalizeNigerianPhone } from "@/shared/lib/phone";
import { generateOtpCode, hashOtpCode } from "../lib/otpCrypto";
import { setPatientSession } from "@/shared/lib/patientCookie";
import { getClientIp, rateLimit } from "@/shared/lib/rateLimit";

// PRD §8 defaults: 6 digits, 10 min expiry, max 5 attempts, 60s resend cooldown.
const CODE_TTL_MS = 10 * 60_000;
const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** FR-M1: entry with booking reference + phone, verified by OTP. No account. */
export async function requestOtp(input: { phone: string; reference: string }): Promise<Result<{ devCode?: string }>> {
  try {
    const prod = process.env.NODE_ENV === "production";
    const ip = getClientIp(await headers());
    if (!rateLimit(`otp:ip:${ip}`, prod ? 10 : 200, 60 * 60_000).ok) {
      return { ok: false, error: "Too many attempts, try again later" };
    }
    const phone = normalizeNigerianPhone(input.phone);
    if (!rateLimit(`otp:phone:${phone}`, prod ? 5 : 100, 60 * 60_000).ok) {
      return { ok: false, error: "Too many codes sent to this number" };
    }
    const appt = await prisma.appointment.findUnique({
      where: { reference: input.reference.trim().toUpperCase() },
      include: { patient: { select: { phone: true } } },
    });
    if (!appt || appt.deletedAt || appt.patient.phone !== phone) {
      return { ok: false, error: "No booking matches that reference and phone" };
    }
    const recent = await prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < COOLDOWN_MS) {
      return { ok: false, error: "A code was just sent — wait a minute before retrying" };
    }
    const code = generateOtpCode();
    await prisma.otpChallenge.create({
      data: { phone, codeHash: hashOtpCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    });
    await sendSms(phone, `MedServe code: ${code}. It expires in 10 minutes.`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[otp:dev] code for this request: ${code}`);
      return { ok: true, devCode: code };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send code" };
  }
}

export async function verifyOtp(input: { phone: string; code: string }): Promise<Result> {
  try {
    const phone = normalizeNigerianPhone(input.phone);
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) return { ok: false, error: "Code expired — request a new one" };
    if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many tries — request a new code" };
    const good = timingSafeEqual(
      Buffer.from(hashOtpCode(input.code.trim()), "hex"),
      Buffer.from(challenge.codeHash, "hex"),
    );
    if (!good) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "Wrong code — check and retry" };
    }
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    await setPatientSession(phone);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Verification failed" };
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "ms-patient";
const TTL_MS = 24 * 3600_000;

export type PatientSession = {
  phone?: string;
  email?: string;
  patientId?: string;
  name?: string;
  exp: number;
};

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is required for patient sessions");
  return s;
}

function b64url(data: string): string {
  return Buffer.from(data, "utf8").toString("base64url");
}

function unb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

/** Sealed (HMAC-signed) patient session — scoped to phone/email/id, no server store needed. */
export function sealPatientSession(
  input: string | { phone?: string; email?: string; patientId?: string; name?: string },
  now = Date.now(),
): string {
  const data = typeof input === "string" ? { phone: input } : input;
  const payload = b64url(JSON.stringify({ ...data, exp: now + TTL_MS } satisfies PatientSession));
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function unsealPatientSession(token: string, now = Date.now()): PatientSession | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const parsed = JSON.parse(unb64url(payload)) as PatientSession;
    if (typeof parsed.exp !== "number" || parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const PATIENT_COOKIE = COOKIE;

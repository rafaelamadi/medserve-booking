import { describe, expect, it } from "vitest";
import { generateOtpCode, hashOtpCode } from "@/features/verify-phone-otp/lib/otpCrypto";

describe("Patient OTP Crypto & Format Verification", () => {
  it("generates 6-digit numeric OTP", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code, 10)).toBeLessThan(1000000);
  });

  it("produces deterministic SHA-256 hash for codes", () => {
    const hash1 = hashOtpCode("123456");
    const hash2 = hashOtpCode("123456");
    const hash3 = hashOtpCode("654321");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });
});

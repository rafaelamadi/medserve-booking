import { describe, expect, it } from "vitest";
import { generateOtpCode, hashOtpCode } from "./otpCrypto";

describe("OTP helpers (PRD §8)", () => {
  it("generates 6-digit codes", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes deterministically", () => {
    expect(hashOtpCode("123456")).toBe(hashOtpCode("123456"));
    expect(hashOtpCode("123456")).not.toBe(hashOtpCode("654321"));
  });
});

import { describe, expect, it, vi } from "vitest";
import { sealPatientSession, unsealPatientSession } from "./patientSession";

describe("patient session seal (FR-M1)", () => {
  it("round-trips a phone-scoped session", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-32-chars-minimum-abcdef");
    const token = sealPatientSession("+2348031234567", 1000);
    const back = unsealPatientSession(token, 2000);
    expect(back?.phone).toBe("+2348031234567");
    vi.unstubAllEnvs();
  });

  it("round-trips an email-scoped session with name and patientId", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-32-chars-minimum-abcdef");
    const token = sealPatientSession({
      email: "ngozi@example.com",
      name: "Ngozi Adeleke",
      patientId: "pat_123",
    }, 1000);
    const back = unsealPatientSession(token, 2000);
    expect(back?.email).toBe("ngozi@example.com");
    expect(back?.name).toBe("Ngozi Adeleke");
    expect(back?.patientId).toBe("pat_123");
    vi.unstubAllEnvs();
  });

  it("rejects tampered tokens and expiry", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-32-chars-minimum-abcdef");
    const token = sealPatientSession("+2348031234567", 1000);
    const [payload] = token.split(".");
    expect(unsealPatientSession(`${payload}.bogus-signature`, 2000)).toBeNull();
    expect(unsealPatientSession(token, 1000 + 25 * 3600_000)).toBeNull();
    vi.unstubAllEnvs();
  });
});

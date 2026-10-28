import { describe, expect, it } from "vitest";
import {
  followUpDueMessage,
  resultNudgeMessage,
  resultReadyMessage,
} from "./templates";

const BASE = {
  reference: "MS-MKDC-ABC123",
  centreName: "MedServe Kano Diagnostic Centre",
  centrePhone: "+2348000000002",
  instruction: "Collect at the front desk with your reference number",
};

describe("result + follow-up templates (FR-R2: generic only)", () => {
  it("RESULT_READY carries ref/centre/instruction and no clinical content", () => {
    const msg = resultReadyMessage(BASE);
    expect(msg).toContain("MS-MKDC-ABC123");
    expect(msg).toContain("MedServe Kano Diagnostic Centre");
    expect(msg).toContain("Collect at the front desk");
    expect(msg).not.toMatch(/\bmri\b|\bblood\b|positive|negative|findings/i);
  });

  it("RESULT_NUDGE is a gentle reminder with the same generic shape", () => {
    const msg = resultNudgeMessage(BASE);
    expect(msg).toContain("MS-MKDC-ABC123");
    expect(msg).not.toMatch(/positive|negative|result is \w+:/i);
  });

  it("FOLLOWUP_DUE links the prefilled booking form without clinical detail", () => {
    const msg = followUpDueMessage({
      centreName: BASE.centreName,
      centrePhone: BASE.centrePhone,
      bookingUrl: "http://localhost:3000/book?centre=MKDC&service=mammography",
    });
    expect(msg).toContain("/book?centre=MKDC&service=mammography");
    expect(msg).toContain("follow-up screening");
  });
});

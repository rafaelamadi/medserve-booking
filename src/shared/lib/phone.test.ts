import { describe, expect, it } from "vitest";
import { normalizeNigerianPhone } from "./phone";

describe("normalizeNigerianPhone (FR-X phone rule)", () => {
  it("normalises 0-prefixed numbers", () => {
    expect(normalizeNigerianPhone("0803 123 4567")).toBe("+2348031234567");
  });

  it("keeps E.164 input", () => {
    expect(normalizeNigerianPhone("+2348031234567")).toBe("+2348031234567");
  });

  it("rejects invalid input", () => {
    expect(() => normalizeNigerianPhone("123")).toThrow();
  });
});

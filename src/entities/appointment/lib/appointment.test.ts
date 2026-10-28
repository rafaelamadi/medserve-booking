import { describe, expect, it } from "vitest";
import { generateReference } from "./reference";
import { assertTransition, canTransition } from "./statusMachine";

describe("generateReference (PRD §8: MS-<CENTRECODE>-<6 chars>)", () => {
  it("matches the required format with unambiguous alphabet", () => {
    expect(generateReference("MLCC", () => 0.5)).toBe("MS-MLCC-SSSSSS");
    expect(generateReference("MKDC")).toMatch(/^MS-MKDC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("generates unique references", () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateReference("MLCC")));
    expect(set.size).toBe(1000);
  });
});

describe("status machine (PRD §6.1)", () => {
  it("REQUESTED → CONFIRMED / CANCELLED only", () => {
    expect(canTransition("REQUESTED", "CONFIRMED")).toBe(true);
    expect(canTransition("REQUESTED", "CANCELLED")).toBe(true);
    expect(canTransition("REQUESTED", "CHECKED_IN")).toBe(false);
  });

  it("AUTO reschedule path skips RESCHEDULE_REQUESTED (CONFIRMED stays reachable)", () => {
    expect(canTransition("CONFIRMED", "RESCHEDULE_REQUESTED")).toBe(true);
    expect(canTransition("RESCHEDULE_REQUESTED", "CONFIRMED")).toBe(true);
    expect(canTransition("RESCHEDULE_PROPOSED", "CONFIRMED")).toBe(true);
  });

  it("terminal states have no exits", () => {
    for (const t of ["COMPLETED", "NO_SHOW", "CANCELLED"] as const) {
      expect(canTransition(t, "CONFIRMED")).toBe(false);
    }
  });

  it("assertTransition throws on illegal moves", () => {
    expect(() => assertTransition("COMPLETED", "CONFIRMED")).toThrow();
  });
});

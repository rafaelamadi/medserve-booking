import { describe, expect, it } from "vitest";
import { planShiftRemaining } from "./shiftPlan";

const CLOSED = {
  holidays: ["2026-10-01"],
  closures: [{ startsOn: "2026-10-20", endsOn: "2026-10-21" }],
};

describe("planShiftRemaining (FR-S6)", () => {
  it("shifts remaining sessions preserving spacing", () => {
    const plan = planShiftRemaining(
      [
        { id: "a", date: "2026-10-05" },
        { id: "b", date: "2026-10-06" },
        { id: "c", date: "2026-10-07" },
      ],
      "2026-10-06",
      3,
      { holidays: [], closures: [] },
    );
    // 10-06+3 = Fri 10-09 open; 10-07+3 = Sat 10-10 → Mon 10-12.
    expect(plan).toEqual([
      { id: "b", oldDate: "2026-10-06", newDate: "2026-10-09", adjusted: false },
      { id: "c", oldDate: "2026-10-07", newDate: "2026-10-12", adjusted: true },
    ]);
  });

  it("pushes closed landings forward", () => {
    const plan = planShiftRemaining([{ id: "a", date: "2026-10-19" }], "2026-10-19", 1, CLOSED);
    // 10-20 is a closure → 10-22 (10-21 also closed).
    expect(plan).toEqual([{ id: "a", oldDate: "2026-10-19", newDate: "2026-10-22", adjusted: true }]);
  });

  it("rejects zero shifts", () => {
    expect(() => planShiftRemaining([{ id: "a", date: "2026-10-05" }], "2026-10-05", 0, CLOSED)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { generateSlotsForDay, nearestSlots } from "./generateSlots";
import { localToUtc } from "./timezone";

// Wednesday 2026-10-07. All times Africa/Lagos (UTC+1, no DST).
const TZ = "Africa/Lagos";
const WED_RULES = [{ dayOfWeek: 3, startMinute: 480, endMinute: 540 }]; // 08:00–09:00

function baseInput(overrides = {}) {
  return {
    date: "2026-10-07",
    timeZone: TZ,
    rules: WED_RULES,
    slotMinutes: 30,
    capacityPerSlot: 1,
    bookedCounts: {} as Record<string, number>,
    minLeadMinutes: 0,
    now: new Date("2026-10-07T04:00:00Z"), // 05:00 Lagos, well before slots
    ...overrides,
  };
}

describe("generateSlotsForDay (PRD §7)", () => {
  it("generates slots from rules (08:00, 08:30)", () => {
    const slots = generateSlotsForDay(baseInput());
    expect(slots.map((s) => s.start)).toEqual(["08:00", "08:30"]);
    expect(slots[0].startsAt.toISOString()).toBe("2026-10-07T07:00:00.000Z");
    expect(slots[0].endsAt.toISOString()).toBe("2026-10-07T07:30:00.000Z");
    expect(slots[0].remaining).toBe(1);
  });

  it("returns no slots on a day without rules (weekend)", () => {
    const slots = generateSlotsForDay(baseInput({ date: "2026-10-10" })); // Saturday
    expect(slots).toEqual([]);
  });

  it("returns no slots on holidays", () => {
    const slots = generateSlotsForDay(baseInput({ holidays: ["2026-10-07"] }));
    expect(slots).toEqual([]);
  });

  it("returns no slots inside closures", () => {
    const slots = generateSlotsForDay(
      baseInput({ closures: [{ startsOn: "2026-10-06", endsOn: "2026-10-08" }] }),
    );
    expect(slots).toEqual([]);
  });

  it("excludes full slots, keeps remaining count (FR-B4)", () => {
    const slots = generateSlotsForDay(baseInput({ bookedCounts: { "08:00": 1 } }));
    expect(slots.map((s) => s.start)).toEqual(["08:30"]);
  });

  it("supports capacity > 1 with partial fill", () => {
    const slots = generateSlotsForDay(
      baseInput({ capacityPerSlot: 2, bookedCounts: { "08:00": 1 } }),
    );
    expect(slots.map((s) => s.start)).toEqual(["08:00", "08:30"]);
    expect(slots[0].remaining).toBe(1);
    expect(slots[1].remaining).toBe(2);
  });

  it("excludes past slots and slots inside lead time", () => {
    // now = 07:45 Lagos, lead 120m → cutoff 09:45 Lagos: both slots excluded
    const slots = generateSlotsForDay(
      baseInput({ now: new Date("2026-10-07T06:45:00Z"), minLeadMinutes: 120 }),
    );
    expect(slots).toEqual([]);
  });

  it("keeps slots after the lead cutoff", () => {
    // now = 05:00 Lagos, lead 120m → cutoff 07:00 Lagos: both slots kept
    const slots = generateSlotsForDay(
      baseInput({ now: new Date("2026-10-07T04:00:00Z"), minLeadMinutes: 120 }),
    );
    expect(slots.map((s) => s.start)).toEqual(["08:00", "08:30"]);
  });

  it("drops partial trailing slots (rule 08:00–08:45, 30m → one slot)", () => {
    const slots = generateSlotsForDay(
      baseInput({ rules: [{ dayOfWeek: 3, startMinute: 480, endMinute: 525 }] }),
    );
    expect(slots.map((s) => s.start)).toEqual(["08:00"]);
  });
});

describe("nearestSlots", () => {
  it("returns closest same-day alternatives first", () => {
    const slots = generateSlotsForDay(baseInput());
    const alt = nearestSlots(slots, "08:20", 2);
    expect(alt.map((s) => s.start)).toEqual(["08:30", "08:00"]);
  });
});

describe("localToUtc (Africa/Lagos = UTC+1)", () => {
  it("converts wall time to UTC", () => {
    expect(localToUtc("2026-10-07", 480, TZ).toISOString()).toBe("2026-10-07T07:00:00.000Z");
  });
});

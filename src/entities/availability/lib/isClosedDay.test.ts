import { describe, expect, it } from "vitest";
import { isClosedDay } from "./isClosedDay";

const WEEKDAY_RULES = [
  { dayOfWeek: 1, startMinute: 480, endMinute: 1020 },
  { dayOfWeek: 2, startMinute: 480, endMinute: 1020 },
  { dayOfWeek: 3, startMinute: 480, endMinute: 1020 },
  { dayOfWeek: 4, startMinute: 480, endMinute: 1020 },
  { dayOfWeek: 5, startMinute: 480, endMinute: 1020 },
];

describe("isClosedDay (PRD §7 step 1)", () => {
  it("open weekday with rules is not closed", () => {
    expect(isClosedDay({ date: "2026-10-07", weekday: 3, rules: WEEKDAY_RULES }).closed).toBe(false);
  });

  it("weekend without weekend rules is closed (no-hours)", () => {
    expect(isClosedDay({ date: "2026-10-10", weekday: 6, rules: WEEKDAY_RULES })).toEqual({
      closed: true,
      reason: "no-hours",
    });
  });

  it("weekend with weekend rules is open", () => {
    const rules = [...WEEKDAY_RULES, { dayOfWeek: 6, startMinute: 540, endMinute: 780 }];
    expect(isClosedDay({ date: "2026-10-10", weekday: 6, rules }).closed).toBe(false);
  });

  it("holiday is closed even with rules", () => {
    expect(
      isClosedDay({ date: "2026-10-01", weekday: 4, rules: WEEKDAY_RULES, holidays: ["2026-10-01"] }),
    ).toEqual({ closed: true, reason: "holiday" });
  });

  it("date inside a closure range is closed", () => {
    expect(
      isClosedDay({
        date: "2026-10-08",
        weekday: 4,
        rules: WEEKDAY_RULES,
        closures: [{ startsOn: "2026-10-07", endsOn: "2026-10-09" }],
      }),
    ).toEqual({ closed: true, reason: "closure" });
  });

  it("date outside closure range is open", () => {
    expect(
      isClosedDay({
        date: "2026-10-10",
        weekday: 6,
        rules: [...WEEKDAY_RULES, { dayOfWeek: 6, startMinute: 540, endMinute: 780 }],
        closures: [{ startsOn: "2026-10-07", endsOn: "2026-10-09" }],
      }).closed,
    ).toBe(false);
  });
});

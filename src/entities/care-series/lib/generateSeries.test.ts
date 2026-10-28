import { describe, expect, it } from "vitest";
import { generateSeries } from "./generateSeries";

const CLOSED = {
  holidays: ["2026-10-01"],
  closures: [{ startsOn: "2026-10-20", endsOn: "2026-10-21" }],
};

describe("generateSeries (PRD FR-S3)", () => {
  it("DAILY_WORKING_DAYS skips weekends and holidays", () => {
    // Thu 2026-10-01 is a holiday; Sat/Sun weekend.
    const { sessions, skipped } = generateSeries({
      pattern: "DAILY_WORKING_DAYS",
      totalSessions: 3,
      startDate: "2026-10-01",
      closed: CLOSED,
    });
    expect(sessions.map((s) => s.date)).toEqual(["2026-10-02", "2026-10-05", "2026-10-06"]);
    expect(skipped).toEqual([
      { date: "2026-10-01", reason: "holiday" },
      { date: "2026-10-03", reason: "weekend" },
      { date: "2026-10-04", reason: "weekend" },
    ]);
  });

  it("20-session radiotherapy run skips a holiday week + weekends", () => {
    const { sessions } = generateSeries({
      pattern: "DAILY_WORKING_DAYS",
      totalSessions: 20,
      startDate: "2026-09-28",
      closed: CLOSED,
    });
    expect(sessions).toHaveLength(20);
    expect(sessions.map((s) => s.date)).not.toContain("2026-10-01");
    expect(sessions.every((s) => ![0, 6].includes(new Date(`${s.date}T00:00:00Z`).getUTCDay()))).toBe(true);
    expect(sessions[0].date).toBe("2026-09-28");
  });

  it("EVERY_N_WEEKS moves closed targets and marks the adjustment", () => {
    const { sessions } = generateSeries({
      pattern: "EVERY_N_WEEKS",
      intervalN: 1,
      totalSessions: 3,
      startDate: "2026-09-24", // Thursday
      closed: CLOSED, // 2026-10-01 (Thu) is a holiday
    });
    expect(sessions.map((s) => s.date)).toEqual(["2026-09-24", "2026-10-02", "2026-10-08"]);
    expect(sessions[1].adjustedFrom).toBe("2026-10-01");
  });

  it("EVERY_N_DAYS spaces from the anchor, moving off weekends", () => {
    const { sessions } = generateSeries({
      pattern: "EVERY_N_DAYS",
      intervalN: 3,
      totalSessions: 3,
      startDate: "2026-10-05", // Monday
      closed: { holidays: [], closures: [] },
    });
    // 2026-10-11 is a Sunday → moved to Monday with the adjustment marked.
    expect(sessions.map((s) => s.date)).toEqual(["2026-10-05", "2026-10-08", "2026-10-12"]);
    expect(sessions[2].adjustedFrom).toBe("2026-10-11");
  });

  it("CUSTOM_DATES passes through sorted", () => {
    const { sessions } = generateSeries({
      pattern: "CUSTOM_DATES",
      totalSessions: 0,
      startDate: "2026-10-05",
      customDates: ["2026-10-07", "2026-10-05"],
      closed: CLOSED,
    });
    expect(sessions.map((s) => s.date)).toEqual(["2026-10-05", "2026-10-07"]);
  });

  it("closure days are skipped", () => {
    const { sessions, skipped } = generateSeries({
      pattern: "DAILY_WORKING_DAYS",
      totalSessions: 2,
      startDate: "2026-10-20",
      closed: CLOSED,
    });
    expect(sessions.map((s) => s.date)).toEqual(["2026-10-22", "2026-10-23"]);
    expect(skipped[0]).toEqual({ date: "2026-10-20", reason: "closure" });
  });
});

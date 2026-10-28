import { describe, expect, it } from "vitest";
import { _clearRateLimits, rateLimit } from "./rateLimit";

describe("rateLimit (FR-B10)", () => {
  it("allows up to the limit then blocks", () => {
    _clearRateLimits();
    expect(rateLimit("ip:1", 2, 60_000, 1000).ok).toBe(true);
    expect(rateLimit("ip:1", 2, 60_000, 2000).ok).toBe(true);
    expect(rateLimit("ip:1", 2, 60_000, 3000).ok).toBe(false);
  });

  it("resets after the window", () => {
    _clearRateLimits();
    rateLimit("ip:2", 1, 60_000, 1000);
    expect(rateLimit("ip:2", 1, 60_000, 2000).ok).toBe(false);
    expect(rateLimit("ip:2", 1, 60_000, 62_000).ok).toBe(true);
  });
});

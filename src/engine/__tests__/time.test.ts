import { describe, it, expect } from "vitest";
import {
  calculateDaysElapsed,
  calculateDaysRemaining,
  calculateTotalProjectDays,
} from "../calculations";

describe("Days Elapsed", () => {
  it("returns 0 when no start date", () => {
    expect(calculateDaysElapsed(null)).toBe(0);
  });
});

describe("Days Remaining", () => {
  it("returns 0 when no end date", () => {
    expect(calculateDaysRemaining(null)).toBe(0);
  });
});

describe("Total Project Days", () => {
  it("returns 0 when missing dates", () => {
    expect(calculateTotalProjectDays(null, null)).toBe(0);
    expect(calculateTotalProjectDays("2026-01-01", null)).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { BusinessDate } from "./BusinessDate";

describe("BusinessDate Value Object", () => {
  it("creates a valid BusinessDate from YYYY-MM-DD string", () => {
    const date = BusinessDate.fromString("2026-10-01");
    expect(date.toString()).toBe("2026-10-01");
  });

  it("throws error on invalid date string format", () => {
    expect(() => BusinessDate.fromString("invalid-date")).toThrow();
    expect(() => BusinessDate.fromString("2026/10/01")).toThrow();
    expect(() => BusinessDate.fromString("01-10-2026")).toThrow();
  });

  it("throws error on invalid calendar date", () => {
    expect(() => BusinessDate.fromString("2026-02-30")).toThrow();
  });

  it("adds calendar days accurately", () => {
    const start = BusinessDate.fromString("2026-10-01");
    const next = start.addDays(14); // 15th day
    expect(next.toString()).toBe("2026-10-15");

    const monthCross = start.addDays(31);
    expect(monthCross.toString()).toBe("2026-11-01");
  });

  it("calculates difference in days between two business dates", () => {
    const d1 = BusinessDate.fromString("2026-10-01");
    const d2 = BusinessDate.fromString("2026-10-16");
    expect(d2.diffInDays(d1)).toBe(15);
    expect(d1.diffInDays(d2)).toBe(-15);
  });

  it("calculates ageDay starting at 1 on entry date", () => {
    const entryDate = BusinessDate.fromString("2026-10-01");
    expect(entryDate.getAgeDayFromEntry(entryDate)).toBe(1);

    const day15 = BusinessDate.fromString("2026-10-15");
    expect(day15.getAgeDayFromEntry(entryDate)).toBe(15);

    const day16 = BusinessDate.fromString("2026-10-16");
    expect(day16.getAgeDayFromEntry(entryDate)).toBe(16);
  });

  it("compares dates correctly", () => {
    const d1 = BusinessDate.fromString("2026-10-01");
    const d2 = BusinessDate.fromString("2026-10-02");
    expect(d1.isBefore(d2)).toBe(true);
    expect(d2.isAfter(d1)).toBe(true);
    expect(d1.equals(BusinessDate.fromString("2026-10-01"))).toBe(true);
  });

  it("formats date in Arabic", () => {
    const d = BusinessDate.fromString("2026-10-01");
    expect(d.formatArabic()).toBe("01/10/2026");
  });
});

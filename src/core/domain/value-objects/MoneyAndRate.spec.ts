import { describe, it, expect } from "vitest";
import { Money } from "./Money";
import { DailyStorageRate } from "./DailyStorageRate";
import { Weight } from "./Weight";

describe("Money Value Object", () => {
  it("creates money from milli-YER and converts to YER", () => {
    const m = Money.fromMilliYer(5500);
    expect(m.getMilliYer()).toBe(5500);
    expect(m.toYer()).toBe(5.5);
  });

  it("handles basic arithmetic with exact precision", () => {
    const m1 = Money.fromYer(100.25);
    const m2 = Money.fromYer(50.5);

    const sum = m1.add(m2);
    expect(sum.toYer()).toBe(150.75);

    const diff = m1.subtract(m2);
    expect(diff.toYer()).toBe(49.75);

    const mult = m2.multiply(2);
    expect(mult.toYer()).toBe(101.0);
  });

  it("checks positivity, negativity, and zero", () => {
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.fromYer(10).isPositive()).toBe(true);
    expect(Money.fromYer(-10).isNegative()).toBe(true);
  });
});

describe("DailyStorageRate Value Object", () => {
  it("stores rate in milli-YER per KG per day", () => {
    const rate = DailyStorageRate.fromYer(5.5);
    expect(rate.toYer()).toBe(5.5);
    expect(rate.getMilliYer()).toBe(5500);
  });

  it("applies multiplier correctly", () => {
    const baseRate = DailyStorageRate.fromYer(5);
    const doubled = baseRate.applyMultiplier(2);
    expect(doubled.toYer()).toBe(10);

    const quadrupled = baseRate.applyMultiplier(4);
    expect(quadrupled.toYer()).toBe(20);
  });

  it("calculates exact daily fee for a given weight", () => {
    const rate = DailyStorageRate.fromYer(5); // 5 YER/KG/day
    const weight = Weight.fromKilograms(2000); // 2000 KG

    const fee = rate.calculateDailyFee(weight);
    expect(fee.toYer()).toBe(10000); // 2000 * 5 = 10,000 YER
  });
});

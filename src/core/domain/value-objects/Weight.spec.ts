import { describe, it, expect } from "vitest";
import { Weight } from "./Weight";

describe("Weight Value Object", () => {
  it("creates weight from integer grams", () => {
    const w = Weight.fromGrams(5000);
    expect(w.getGrams()).toBe(5000);
    expect(w.toKilograms()).toBe(5);
  });

  it("creates weight from kilograms without floating point errors", () => {
    const w = Weight.fromKilograms(1250.75);
    expect(w.getGrams()).toBe(1250750);
    expect(w.toKilograms()).toBe(1250.75);
  });

  it("creates weight from tons", () => {
    const w = Weight.fromTons(3.5);
    expect(w.getGrams()).toBe(3500000);
    expect(w.toKilograms()).toBe(3500);
    expect(w.toTons()).toBe(3.5);
  });

  it("throws error on negative weight", () => {
    expect(() => Weight.fromGrams(-100)).toThrow();
    expect(() => Weight.fromKilograms(-5)).toThrow();
  });

  it("adds and subtracts weights accurately", () => {
    const w1 = Weight.fromKilograms(5000);
    const w2 = Weight.fromKilograms(2000);

    const sum = w1.add(w2);
    expect(sum.toKilograms()).toBe(7000);

    const diff = w1.subtract(w2);
    expect(diff.toKilograms()).toBe(3000);
  });

  it("throws error when subtracting a larger weight", () => {
    const w1 = Weight.fromKilograms(1000);
    const w2 = Weight.fromKilograms(2000);
    expect(() => w1.subtract(w2)).toThrow();
  });

  it("correctly compares weights", () => {
    const w1 = Weight.fromKilograms(1000);
    const w2 = Weight.fromKilograms(2000);
    expect(w1.isLessThan(w2)).toBe(true);
    expect(w2.isGreaterThan(w1)).toBe(true);
    expect(w1.equals(Weight.fromKilograms(1000))).toBe(true);
  });
});

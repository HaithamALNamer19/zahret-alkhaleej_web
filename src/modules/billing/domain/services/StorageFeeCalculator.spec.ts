import { describe, it, expect } from "vitest";
import { StorageFeeCalculator } from "./StorageFeeCalculator";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";

describe("StorageFeeCalculator Pure Domain Service", () => {
  const entryDate = BusinessDate.fromString("2026-10-01");
  const baseRate = DailyStorageRate.fromYer(5); // 5 YER / KG / Day
  const initialWeight = Weight.fromKilograms(10000); // 10,000 KG

  describe("Free Period & Multiplier Transitions (Section #135)", () => {
    it("charges 0 fee on Day 1 (entry date)", () => {
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: BusinessDate.fromString("2026-10-01"), // Day 1
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.totalFee.toYer()).toBe(0);
      expect(res.currentMultiplier).toBe(0);
      expect(res.freeDaysRemaining).toBe(14);
      expect(res.chargeableDays).toBe(0);
    });

    it("charges 0 fee on Day 15 (last free day)", () => {
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: BusinessDate.fromString("2026-10-15"), // Day 15
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.totalFee.toYer()).toBe(0);
      expect(res.currentMultiplier).toBe(0);
      expect(res.freeDaysRemaining).toBe(0);
      expect(res.chargeableDays).toBe(0);
    });

    it("charges 1 paid day at 1x base rate on Day 16 (first paid day)", () => {
      // Day 16: exactly 1 chargeable day
      // 1 day * 10,000 KG * 5 YER = 50,000 YER
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: BusinessDate.fromString("2026-10-16"), // Day 16
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.chargeableDays).toBe(1);
      expect(res.currentMultiplier).toBe(1);
      expect(res.currentStage).toBe(0);
      expect(res.totalFee.toYer()).toBe(50000);
    });

    it("charges 30 paid days at 1x on Day 45 (last day of stage 0)", () => {
      // Days 16 through 45 = 30 chargeable days
      // 30 days * 10,000 KG * 5 YER = 1,500,000 YER
      const day45 = entryDate.addDays(44); // 2026-11-14
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day45,
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.chargeableDays).toBe(30);
      expect(res.currentMultiplier).toBe(1);
      expect(res.currentStage).toBe(0);
      expect(res.totalFee.toYer()).toBe(1500000);
    });

    it("transitions to Stage 1 (2x = 10 YER) on Day 46", () => {
      // Day 46: 30 days at 5 YER + 1 day at 10 YER
      // Stage 0: 30 * 10,000 * 5 = 1,500,000
      // Stage 1: 1 * 10,000 * 10 = 100,000
      // Total = 1,600,000 YER
      const day46 = entryDate.addDays(45);
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day46,
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.chargeableDays).toBe(31);
      expect(res.currentStage).toBe(1);
      expect(res.currentMultiplier).toBe(2);
      expect(res.currentDailyRate.toYer()).toBe(10);
      expect(res.totalFee.toYer()).toBe(1600000);
    });

    it("reaches end of Stage 1 on Day 75 (30 days at 1x + 30 days at 2x)", () => {
      // Stage 0: 30 days * 10,000 * 5 = 1,500,000
      // Stage 1: 30 days * 10,000 * 10 = 3,000,000
      // Total = 4,500,000 YER
      const day75 = entryDate.addDays(74);
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day75,
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.chargeableDays).toBe(60);
      expect(res.currentStage).toBe(1);
      expect(res.currentMultiplier).toBe(2);
      expect(res.totalFee.toYer()).toBe(4500000);
    });

    it("transitions to Stage 2 (4x = 20 YER) on Day 76", () => {
      // Stage 0: 1,500,000
      // Stage 1: 3,000,000
      // Stage 2: 1 day * 10,000 * 20 = 200,000
      // Total = 4,700,000 YER
      const day76 = entryDate.addDays(75);
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day76,
        originalWeight: initialWeight,
        withdrawals: [],
        baseRate,
      });

      expect(res.chargeableDays).toBe(61);
      expect(res.currentStage).toBe(2);
      expect(res.currentMultiplier).toBe(4);
      expect(res.currentDailyRate.toYer()).toBe(20);
      expect(res.totalFee.toYer()).toBe(4700000);
    });
  });

  describe("Withdrawal Fee Rule: Effect Starts Next Day (Sections #54-#55, #136)", () => {
    it("charges Day 20 at 10,000 KG and Day 21 at 6,000 KG when 4,000 KG withdrawn on Day 20", () => {
      const day20 = entryDate.addDays(19); // 2026-10-20
      const day21 = entryDate.addDays(20); // 2026-10-21

      const withdrawals = [
        {
          withdrawalDate: day20,
          withdrawnWeight: Weight.fromKilograms(4000),
        },
      ];

      // Calculation as of Day 20:
      // Days 16..20 = 5 paid days, all at 10,000 KG @ 5 YER = 5 * 50,000 = 250,000 YER
      const resDay20 = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day20,
        originalWeight: initialWeight,
        withdrawals,
        baseRate,
      });
      expect(resDay20.chargeableDays).toBe(5);
      expect(resDay20.totalFee.toYer()).toBe(250000);

      // Calculation as of Day 21:
      // Days 16..20 (5 days): 10,000 KG @ 5 YER = 250,000 YER
      // Day 21 (1 day): 6,000 KG @ 5 YER = 30,000 YER
      // Total = 280,000 YER
      const resDay21 = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day21,
        originalWeight: initialWeight,
        withdrawals,
        baseRate,
      });
      expect(resDay21.chargeableDays).toBe(6);
      expect(resDay21.totalFee.toYer()).toBe(280000);
    });

    it("stops charging fees immediately after withdrawal date when lot is completely exhausted", () => {
      // 10,000 KG withdrawn completely on Day 20
      const day20 = entryDate.addDays(19);
      const day30 = entryDate.addDays(29);

      const withdrawals = [
        {
          withdrawalDate: day20,
          withdrawnWeight: Weight.fromKilograms(10000),
        },
      ];

      const resDay30 = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day30,
        originalWeight: initialWeight,
        withdrawals,
        baseRate,
      });

      // Exactly 5 paid days (Day 16 to 20), Day 21 onwards has 0 weight -> 0 fee
      expect(resDay30.chargeableDays).toBe(5);
      expect(resDay30.totalFee.toYer()).toBe(250000);
    });
  });

  describe("Multiple Withdrawals Across Stages (Section #137)", () => {
    it("calculates accurate segmented fees for multiple partial withdrawals", () => {
      // Initial: 10,000 KG
      // Day 20: -2,000 KG (leaving 8,000 KG from Day 21)
      // Day 35: -3,000 KG (leaving 5,000 KG from Day 36)
      // Day 60: -1,000 KG (leaving 4,000 KG from Day 61)
      const day20 = entryDate.addDays(19);
      const day35 = entryDate.addDays(34);
      const day60 = entryDate.addDays(59);

      const withdrawals = [
        { withdrawalDate: day20, withdrawnWeight: Weight.fromKilograms(2000) },
        { withdrawalDate: day35, withdrawnWeight: Weight.fromKilograms(3000) },
        { withdrawalDate: day60, withdrawnWeight: Weight.fromKilograms(1000) },
      ];

      // Calculate up to Day 65 (in Stage 1: 2x = 10 YER)
      const day65 = entryDate.addDays(64);
      const res = StorageFeeCalculator.calculate({
        entryDate,
        asOfDate: day65,
        originalWeight: initialWeight,
        withdrawals,
        baseRate,
      });

      // Verification of segments:
      // Seg 1 (Day 16-20, 5 days, 10,000 KG, 1x rate = 5 YER): 5 * 10,000 * 5 = 250,000
      // Seg 2 (Day 21-35, 15 days, 8,000 KG, 1x rate = 5 YER): 15 * 8,000 * 5 = 600,000
      // Seg 3 (Day 36-45, 10 days, 5,000 KG, 1x rate = 5 YER): 10 * 5,000 * 5 = 250,000
      // [End of Stage 0, Total Stage 0 = 1,100,000]
      // Seg 4 (Day 46-60, 15 days, 5,000 KG, 2x rate = 10 YER): 15 * 5,000 * 10 = 750,000
      // Seg 5 (Day 61-65, 5 days, 4,000 KG, 2x rate = 10 YER): 5 * 4,000 * 10 = 200,000
      // Total = 1,100,000 + 750,000 + 200,000 = 2,050,000 YER
      expect(res.totalFee.toYer()).toBe(2050000);
      expect(res.chargeableDays).toBe(50);
    });
  });
});

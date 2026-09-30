import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { Money } from "@/core/domain/value-objects/Money";

export interface WithdrawalEvent {
  withdrawalDate: BusinessDate;
  withdrawnWeight: Weight;
}

export interface FeeCalculationSegment {
  startDate: BusinessDate;
  endDate: BusinessDate;
  daysCount: number;
  stage: number;
  multiplier: number;
  effectiveRate: DailyStorageRate;
  effectiveWeight: Weight;
  segmentFee: Money;
}

export interface StorageFeeCalculationResult {
  totalFee: Money;
  currentMultiplier: number;
  currentDailyRate: DailyStorageRate;
  currentStage: number;
  chargeableDays: number;
  freeDaysRemaining: number;
  segments: FeeCalculationSegment[];
}

export class StorageFeeCalculator {
  /**
   * Pure Domain Service to calculate storage fees for a lot up to asOfDate.
   * Uses analytical segmentation rather than naive daily loops.
   */
  public static calculate(params: {
    entryDate: BusinessDate;
    asOfDate: BusinessDate;
    originalWeight: Weight;
    withdrawals: WithdrawalEvent[];
    baseRate: DailyStorageRate;
    freeDays?: number; // default 15
    stageDays?: number; // default 30
    doublingFactor?: number; // default 2
  }): StorageFeeCalculationResult {
    const {
      entryDate,
      asOfDate,
      originalWeight,
      withdrawals,
      baseRate,
      freeDays = 15,
      stageDays = 30,
      doublingFactor = 2,
    } = params;

    // Invariant: if asOfDate is before entryDate, 0 fee
    if (asOfDate.isBefore(entryDate)) {
      return {
        totalFee: Money.zero(),
        currentMultiplier: 0,
        currentDailyRate: baseRate,
        currentStage: 0,
        chargeableDays: 0,
        freeDaysRemaining: freeDays,
        segments: [],
      };
    }

    // 1. Build critical event boundaries
    // Age day on asOfDate:
    const totalAgeDays = asOfDate.getAgeDayFromEntry(entryDate);
    const freeDaysRemaining = Math.max(0, freeDays - totalAgeDays);

    // Compute current status as of asOfDate
    let currentMultiplier = 0;
    let currentStage = 0;
    if (totalAgeDays > freeDays) {
      currentStage = Math.floor((totalAgeDays - freeDays - 1) / stageDays);
      currentMultiplier = Math.pow(doublingFactor, currentStage);
    }
    const currentDailyRate = baseRate.applyMultiplier(currentMultiplier);

    // If completely within free period, total fee is 0
    if (totalAgeDays <= freeDays) {
      return {
        totalFee: Money.zero(),
        currentMultiplier: 0,
        currentDailyRate,
        currentStage: 0,
        chargeableDays: 0,
        freeDaysRemaining,
        segments: [],
      };
    }

    // 2. Prepare weight timeline
    // Each withdrawal affects weight starting the NEXT DAY (withdrawalDate + 1)
    // Sort withdrawals by date ASC
    const sortedWithdrawals = [...withdrawals].sort((a, b) => {
      if (a.withdrawalDate.isBefore(b.withdrawalDate)) return -1;
      if (a.withdrawalDate.isAfter(b.withdrawalDate)) return 1;
      return 0;
    });

    // Identify all critical milestone dates:
    // (a) First chargeable date: entryDate + freeDays
    const firstChargeableDate = entryDate.addDays(freeDays);

    // If asOfDate is before first chargeable date (handled above), but double check:
    if (asOfDate.isBefore(firstChargeableDate)) {
      return {
        totalFee: Money.zero(),
        currentMultiplier: 0,
        currentDailyRate,
        currentStage: 0,
        chargeableDays: 0,
        freeDaysRemaining,
        segments: [],
      };
    }

    // Collect all milestone dates in set (ISO strings)
    const milestoneDatesSet = new Set<string>();
    milestoneDatesSet.add(firstChargeableDate.toString());
    milestoneDatesSet.add(asOfDate.toString());

    // Add stage boundary start dates:
    // Stage 0: entryDate + freeDays -> entryDate + freeDays + stageDays - 1
    // Stage k starts at: entryDate + freeDays + k * stageDays
    const maxStages = Math.ceil(totalAgeDays / stageDays) + 1;
    for (let k = 0; k <= maxStages; k++) {
      const stageStartDate = entryDate.addDays(freeDays + k * stageDays);
      if (stageStartDate.isSameOrBefore(asOfDate) && stageStartDate.isSameOrAfter(firstChargeableDate)) {
        milestoneDatesSet.add(stageStartDate.toString());
      }
    }

    // Add withdrawal effective dates: withdrawalDate + 1
    for (const w of sortedWithdrawals) {
      const effDate = w.withdrawalDate.addDays(1);
      if (effDate.isSameOrBefore(asOfDate) && effDate.isSameOrAfter(firstChargeableDate)) {
        milestoneDatesSet.add(effDate.toString());
      }
    }

    // Sort all milestones chronologically
    const sortedMilestones = Array.from(milestoneDatesSet)
      .map((str) => BusinessDate.fromString(str))
      .sort((a, b) => (a.isBefore(b) ? -1 : a.isAfter(b) ? 1 : 0));

    // 3. Construct Segments between consecutive milestones
    const segments: FeeCalculationSegment[] = [];
    let totalFeeMilliYer = 0;
    let chargeableDays = 0;

    for (let i = 0; i < sortedMilestones.length; i++) {
      const segStart = sortedMilestones[i];
      // Segment end is either the day before the next milestone, or asOfDate if this is the last milestone
      const segEnd =
        i + 1 < sortedMilestones.length
          ? sortedMilestones[i + 1].addDays(-1)
          : asOfDate;

      if (segEnd.isBefore(segStart)) continue;

      const daysInSeg = segEnd.diffInDays(segStart) + 1;
      if (daysInSeg <= 0) continue;

      // Determine stage and multiplier for this segment (based on segStart ageDay)
      const ageDay = segStart.getAgeDayFromEntry(entryDate);
      const stage = Math.floor((ageDay - freeDays - 1) / stageDays);
      const multiplier = Math.pow(doublingFactor, stage);
      const effectiveRate = baseRate.applyMultiplier(multiplier);

      // Determine remaining weight active during this segment
      // A withdrawal takes effect on day > withdrawalDate (i.e. withdrawalDate + 1 <= segStart)
      let effectiveWeight = originalWeight;
      for (const w of sortedWithdrawals) {
        if (w.withdrawalDate.isBefore(segStart)) {
          // If already withdrawn before or on yesterday
          if (w.withdrawnWeight.isGreaterThan(effectiveWeight)) {
            effectiveWeight = Weight.zero();
          } else {
            effectiveWeight = effectiveWeight.subtract(w.withdrawnWeight);
          }
        }
      }

      // If effectiveWeight is 0, no fee for this and subsequent segments
      if (effectiveWeight.isZero()) {
        continue;
      }

      // Calculate fee for segment:
      // daily fee = (effectiveWeight in KG) * (effectiveRate in milliYer)
      // total segment fee = daysInSeg * daily fee
      const dailyFeeMilliYer = Math.round(
        effectiveWeight.toKilograms() * effectiveRate.getMilliYer()
      );
      const segFeeMilliYer = dailyFeeMilliYer * daysInSeg;

      totalFeeMilliYer += segFeeMilliYer;
      chargeableDays += daysInSeg;

      segments.push({
        startDate: segStart,
        endDate: segEnd,
        daysCount: daysInSeg,
        stage,
        multiplier,
        effectiveRate,
        effectiveWeight,
        segmentFee: Money.fromMilliYer(segFeeMilliYer),
      });
    }

    return {
      totalFee: Money.fromMilliYer(totalFeeMilliYer),
      currentMultiplier,
      currentDailyRate,
      currentStage,
      chargeableDays,
      freeDaysRemaining,
      segments,
    };
  }
}

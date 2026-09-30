import { Weight } from "./Weight";
import { Money } from "./Money";

/**
 * DailyStorageRate Value Object
 * Representation: Internal integer milli-YER per KG per day.
 * Example: 5.5 YER/KG/Day = 5500 milli-YER.
 */
export class DailyStorageRate {
  private readonly milliYerPerKgPerDay: number;

  private constructor(milliYerPerKgPerDay: number) {
    if (!Number.isFinite(milliYerPerKgPerDay) || milliYerPerKgPerDay < 0 || !Number.isInteger(milliYerPerKgPerDay)) {
      throw new Error(`سعر التخزين غير صالح: يجب أن يكون عدداً صحيحاً غير سالب (${milliYerPerKgPerDay})`);
    }
    this.milliYerPerKgPerDay = milliYerPerKgPerDay;
  }

  public static fromMilliYer(milliYer: number): DailyStorageRate {
    return new DailyStorageRate(Math.round(milliYer));
  }

  public static fromYer(yer: number): DailyStorageRate {
    if (yer < 0) {
      throw new Error(`سعر التخزين بالريال لا يمكن أن يكون سالباً: ${yer}`);
    }
    return new DailyStorageRate(Math.round(yer * 1000));
  }

  public static zero(): DailyStorageRate {
    return new DailyStorageRate(0);
  }

  public getMilliYer(): number {
    return this.milliYerPerKgPerDay;
  }

  public toYer(): number {
    return this.milliYerPerKgPerDay / 1000;
  }

  /**
   * Multiplies the base rate by stage multiplier (e.g. x1, x2, x4)
   */
  public applyMultiplier(multiplier: number): DailyStorageRate {
    return new DailyStorageRate(Math.round(this.milliYerPerKgPerDay * multiplier));
  }

  /**
   * Calculates the fee for a specific weight for 1 day
   * Formula: (weight in KG) * (rate in milliYer) = total milliYer
   */
  public calculateDailyFee(weight: Weight): Money {
    const kg = weight.toKilograms();
    const totalMilliYer = Math.round(kg * this.milliYerPerKgPerDay);
    return Money.fromMilliYer(totalMilliYer);
  }

  public formatArabic(): string {
    return `${this.toYer().toLocaleString("ar-YE")} ر.ي / كجم / يوم`;
  }

  public toString(): string {
    return `${this.toYer()} YER/KG/Day`;
  }
}

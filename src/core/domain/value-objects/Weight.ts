/**
 * Weight Value Object
 * Invariant: Internal representation is strictly integer grams to eliminate floating point issues.
 * 1 KG = 1,000 grams
 * 1 Ton = 1,000,000 grams
 */
export class Weight {
  private readonly grams: number;

  private constructor(grams: number) {
    if (!Number.isFinite(grams) || grams < 0 || !Number.isInteger(grams)) {
      throw new Error(`وزن غير صالح: يجب أن يكون عدد جرامات صحيح غير سالب (${grams})`);
    }
    this.grams = grams;
  }

  public static fromGrams(grams: number): Weight {
    return new Weight(Math.round(grams));
  }

  public static fromKilograms(kg: number): Weight {
    if (kg < 0) {
      throw new Error(`الوزن بالكيلوجرام لا يمكن أن يكون سالباً: ${kg}`);
    }
    return new Weight(Math.round(kg * 1000));
  }

  public static fromTons(tons: number): Weight {
    if (tons < 0) {
      throw new Error(`الوزن بالطن لا يمكن أن يكون سالباً: ${tons}`);
    }
    return new Weight(Math.round(tons * 1_000_000));
  }

  public static zero(): Weight {
    return new Weight(0);
  }

  public getGrams(): number {
    return this.grams;
  }

  public toKilograms(): number {
    return this.grams / 1000;
  }

  public toTons(): number {
    return this.grams / 1_000_000;
  }

  public isZero(): boolean {
    return this.grams === 0;
  }

  public isPositive(): boolean {
    return this.grams > 0;
  }

  public add(other: Weight): Weight {
    return new Weight(this.grams + other.grams);
  }

  public subtract(other: Weight): Weight {
    if (this.grams < other.grams) {
      throw new Error(
        `لا يمكن طرح وزن أكبر (${other.toKilograms()} كجم) من الوزن الحالي (${this.toKilograms()} كجم)`
      );
    }
    return new Weight(this.grams - other.grams);
  }

  public isGreaterThan(other: Weight): boolean {
    return this.grams > other.grams;
  }

  public isGreaterThanOrEqual(other: Weight): boolean {
    return this.grams >= other.grams;
  }

  public isLessThan(other: Weight): boolean {
    return this.grams < other.grams;
  }

  public equals(other: Weight): boolean {
    return this.grams === other.grams;
  }

  /**
   * Formats weight with Arabic units
   */
  public formatArabic(): string {
    const kg = this.toKilograms();
    if (kg >= 1000) {
      const tons = (kg / 1000).toLocaleString("ar-YE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });
      return `${tons} طن (${kg.toLocaleString("ar-YE")} كجم)`;
    }
    return `${kg.toLocaleString("ar-YE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} كجم`;
  }

  public toString(): string {
    return `${this.toKilograms()} KG`;
  }
}

/**
 * Money Value Object
 * Representation: Internal integer milli-units (1 YER = 1,000 milli-YER) to prevent floating-point discrepancies.
 * Currency: Yemeni Rial (YER)
 */
export class Money {
  private readonly milliYer: number;

  private constructor(milliYer: number) {
    if (!Number.isFinite(milliYer) || !Number.isInteger(milliYer)) {
      throw new Error(`قيمة مالية غير صالحة: يجب أن تكون رقماً صحيحاً (${milliYer})`);
    }
    this.milliYer = milliYer;
  }

  public static fromMilliYer(milliYer: number): Money {
    return new Money(Math.round(milliYer));
  }

  public static fromYer(yer: number): Money {
    return new Money(Math.round(yer * 1000));
  }

  public static zero(): Money {
    return new Money(0);
  }

  public getMilliYer(): number {
    return this.milliYer;
  }

  public toYer(): number {
    return this.milliYer / 1000;
  }

  public isZero(): boolean {
    return this.milliYer === 0;
  }

  public isPositive(): boolean {
    return this.milliYer > 0;
  }

  public isNegative(): boolean {
    return this.milliYer < 0;
  }

  public add(other: Money): Money {
    return new Money(this.milliYer + other.milliYer);
  }

  public subtract(other: Money): Money {
    return new Money(this.milliYer - other.milliYer);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.milliYer * factor));
  }

  public isGreaterThan(other: Money): boolean {
    return this.milliYer > other.milliYer;
  }

  public isLessThan(other: Money): boolean {
    return this.milliYer < other.milliYer;
  }

  public equals(other: Money): boolean {
    return this.milliYer === other.milliYer;
  }

  /**
   * Formats money with Arabic currency suffix
   */
  public formatArabic(): string {
    const val = this.toYer();
    return `${val.toLocaleString("ar-YE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ر.ي`;
  }

  public toString(): string {
    return `${this.toYer().toFixed(2)} YER`;
  }
}

/**
 * BusinessDate Value Object
 * Representation: "YYYY-MM-DD" strictly independent of browser timezones.
 * Timezone: Asia/Aden
 * Calendar day arithmetic for storage fee billing (not hours or minutes).
 */
export class BusinessDate {
  private readonly isoDate: string; // YYYY-MM-DD

  private constructor(isoDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      throw new Error(`صيغة تاريخ عمل غير صالحة: يجب أن تكون YYYY-MM-DD (${isoDate})`);
    }

    // Verify valid calendar date
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) {
      throw new Error(`أجزاء التاريخ غير صالحة: ${isoDate}`);
    }
    const date = new Date(Date.UTC(y, m - 1, d));
    if (
      date.getUTCFullYear() !== y ||
      date.getUTCMonth() !== m - 1 ||
      date.getUTCDate() !== d
    ) {
      throw new Error(`تاريخ ميلادي غير صالح: ${isoDate}`);
    }

    this.isoDate = isoDate;
  }

  public static fromString(isoDate: string): BusinessDate {
    return new BusinessDate(isoDate.trim());
  }

  /**
   * Creates a BusinessDate for today in Asia/Aden timezone
   */
  public static today(): BusinessDate {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Aden",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return new BusinessDate(formatter.format(new Date()));
  }

  public static fromDate(date: Date): BusinessDate {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Aden",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return new BusinessDate(formatter.format(date));
  }

  public toString(): string {
    return this.isoDate;
  }

  public toDate(): Date {
    const [y, m, d] = this.isoDate.split("-").map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!));
  }

  /**
   * Adds specified number of calendar days
   */
  public addDays(days: number): BusinessDate {
    const [y, m, d] = this.isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(y!, m! - 1, d! + days));
    const nextY = date.getUTCFullYear();
    const nextM = String(date.getUTCMonth() + 1).padStart(2, "0");
    const nextD = String(date.getUTCDate()).padStart(2, "0");
    return new BusinessDate(`${nextY}-${nextM}-${nextD}`);
  }

  /**
   * Difference in calendar days between this and other date
   * this - other (positive if this is after other)
   */
  public diffInDays(other: BusinessDate): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const t1 = this.toDate().getTime();
    const t2 = other.toDate().getTime();
    return Math.round((t1 - t2) / msPerDay);
  }

  /**
   * Age day starting at 1 on entry date:
   * On entryDate: ageDay = 1.
   * On entryDate + 14: ageDay = 15.
   */
  public getAgeDayFromEntry(entryDate: BusinessDate): number {
    return this.diffInDays(entryDate) + 1;
  }

  public isBefore(other: BusinessDate): boolean {
    return this.isoDate < other.isoDate;
  }

  public isAfter(other: BusinessDate): boolean {
    return this.isoDate > other.isoDate;
  }

  public isSameOrBefore(other: BusinessDate): boolean {
    return this.isoDate <= other.isoDate;
  }

  public isSameOrAfter(other: BusinessDate): boolean {
    return this.isoDate >= other.isoDate;
  }

  public equals(other: BusinessDate): boolean {
    return this.isoDate === other.isoDate;
  }

  /**
   * Format in Arabic locale
   */
  public formatArabic(): string {
    const [y, m, d] = this.isoDate.split("-");
    return `${d}/${m}/${y}`;
  }
}

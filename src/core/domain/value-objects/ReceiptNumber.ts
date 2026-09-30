export type ReceiptType = "IN" | "OUT" | "LOT" | "PAY" | "DISC";

/**
 * ReceiptNumber Value Object
 * Standard format: PREFIX-YYYY-NUMBER (e.g. IN-2026-000001)
 */
export class ReceiptNumber {
  private readonly value: string;

  private constructor(value: string) {
    if (!/^[A-Z]{2,4}-\d{4}-\d{6}$/.test(value)) {
      throw new Error(`صيغة رقم سند/دفعة غير صالحة: ${value}. يجب أن تكون مثل: IN-2026-000001`);
    }
    this.value = value;
  }

  public static create(type: ReceiptType, year: number, sequenceNumber: number): ReceiptNumber {
    const padded = String(sequenceNumber).padStart(6, "0");
    return new ReceiptNumber(`${type}-${year}-${padded}`);
  }

  public static fromString(value: string): ReceiptNumber {
    return new ReceiptNumber(value.trim());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ReceiptNumber): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

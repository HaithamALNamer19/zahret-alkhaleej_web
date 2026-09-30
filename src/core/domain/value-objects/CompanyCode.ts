/**
 * CompanyCode Value Object
 * Standard format: COM-000001
 */
export class CompanyCode {
  private readonly value: string;

  private constructor(value: string) {
    if (!/^COM-\d{6}$/.test(value)) {
      throw new Error(`كود شركة غير صالح: ${value}. يجب أن يكون بالصيغة: COM-000001`);
    }
    this.value = value;
  }

  public static create(sequenceNumber: number): CompanyCode {
    const padded = String(sequenceNumber).padStart(6, "0");
    return new CompanyCode(`COM-${padded}`);
  }

  public static fromString(value: string): CompanyCode {
    return new CompanyCode(value.trim());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: CompanyCode): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

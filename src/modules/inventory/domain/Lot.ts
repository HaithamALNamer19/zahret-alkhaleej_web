import { Weight } from "@/core/domain/value-objects/Weight";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";

export type LotStatus = "OPEN" | "EXHAUSTED" | "CANCELLED";

export interface LotProps {
  id: string;
  lotNumber: ReceiptNumber;
  inboundReceiptId: string;
  companyId: string;
  fishItemId: string;
  fishSizeId: string;

  // Snapshots
  fishNameSnapshot: string;
  fishSizeSnapshot: string;
  baseDailyRateSnapshot: DailyStorageRate;
  freeDaysSnapshot: number;
  stageDaysSnapshot: number;
  doublingFactorSnapshot: number;

  originalWeight: Weight;
  remainingWeight: Weight;
  entryDate: BusinessDate;
  lastWithdrawalDate?: BusinessDate;

  status: LotStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Lot {
  private constructor(private readonly props: LotProps) {}

  public static create(
    props: Omit<LotProps, "remainingWeight" | "status" | "createdAt" | "updatedAt">
  ): Lot {
    const now = new Date();
    return new Lot({
      ...props,
      remainingWeight: props.originalWeight,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: LotProps): Lot {
    return new Lot(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getLotNumber(): ReceiptNumber {
    return this.props.lotNumber;
  }

  public getInboundReceiptId(): string {
    return this.props.inboundReceiptId;
  }

  public getCompanyId(): string {
    return this.props.companyId;
  }

  public getFishItemId(): string {
    return this.props.fishItemId;
  }

  public getFishSizeId(): string {
    return this.props.fishSizeId;
  }

  public getFishNameSnapshot(): string {
    return this.props.fishNameSnapshot;
  }

  public getFishSizeSnapshot(): string {
    return this.props.fishSizeSnapshot;
  }

  public getBaseDailyRateSnapshot(): DailyStorageRate {
    return this.props.baseDailyRateSnapshot;
  }

  public getFreeDaysSnapshot(): number {
    return this.props.freeDaysSnapshot;
  }

  public getStageDaysSnapshot(): number {
    return this.props.stageDaysSnapshot;
  }

  public getDoublingFactorSnapshot(): number {
    return this.props.doublingFactorSnapshot;
  }

  public getOriginalWeight(): Weight {
    return this.props.originalWeight;
  }

  public getRemainingWeight(): Weight {
    return this.props.remainingWeight;
  }

  public getEntryDate(): BusinessDate {
    return this.props.entryDate;
  }

  public getLastWithdrawalDate(): BusinessDate | undefined {
    return this.props.lastWithdrawalDate;
  }

  public getStatus(): LotStatus {
    return this.props.status;
  }

  public getCreatedBy(): string {
    return this.props.createdBy;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public withdraw(amount: Weight, withdrawalDate: BusinessDate): void {
    if (this.props.status !== "OPEN") {
      throw new Error(`لا يمكن الصرف من دفعة غير مفتوحة (حالتها: ${this.props.status})`);
    }

    if (amount.isGreaterThan(this.props.remainingWeight)) {
      throw new Error(
        `الكمية المراد صرفها (${amount.toKilograms()} كجم) أكبر من الرصيد المتبقي في الدفعة (${this.props.remainingWeight.toKilograms()} كجم)`
      );
    }

    this.props.remainingWeight = this.props.remainingWeight.subtract(amount);
    this.props.lastWithdrawalDate = withdrawalDate;
    if (this.props.remainingWeight.isZero()) {
      this.props.status = "EXHAUSTED";
    }
    this.props.updatedAt = new Date();
  }

  public restoreWeight(amount: Weight): void {
    if (this.props.status === "CANCELLED") {
      throw new Error("لا يمكن استعادة كمية لدفعة ملغاة.");
    }

    this.props.remainingWeight = this.props.remainingWeight.add(amount);
    if (this.props.remainingWeight.isGreaterThan(this.props.originalWeight)) {
      throw new Error("الرصيد المستعاد يتجاوز الوزن الأصلي للدفعة.");
    }

    if (this.props.remainingWeight.isPositive()) {
      this.props.status = "OPEN";
    }
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.props.remainingWeight.getGrams() < this.props.originalWeight.getGrams()) {
      throw new Error("لا يمكن إلغاء دفعة تم الصرف منها جزئياً أو كلياً.");
    }
    this.props.status = "CANCELLED";
    this.props.updatedAt = new Date();
  }
}

import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Money } from "@/core/domain/value-objects/Money";

export type DiscountStatus = "POSTED" | "CANCELLED";

export interface DiscountProps {
  id: string;
  discountNumber: ReceiptNumber;
  companyId: string;
  amount: Money;
  reason: string;
  date: BusinessDate;
  createdBy: string;
  approvedBy: string;
  status: DiscountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Discount {
  private constructor(private readonly props: DiscountProps) {}

  public static create(
    props: Omit<DiscountProps, "status" | "createdAt" | "updatedAt">
  ): Discount {
    if (!props.amount.isPositive()) {
      throw new Error("قيمة الخصم يجب أن تكون أكبر من صفر.");
    }
    if (!props.reason || props.reason.trim().length === 0) {
      throw new Error("يجب تحديد سبب الخصم.");
    }

    const now = new Date();
    return new Discount({
      ...props,
      reason: props.reason.trim(),
      status: "POSTED",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: DiscountProps): Discount {
    return new Discount(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getDiscountNumber(): ReceiptNumber {
    return this.props.discountNumber;
  }

  public getCompanyId(): string {
    return this.props.companyId;
  }

  public getAmount(): Money {
    return this.props.amount;
  }

  public getReason(): string {
    return this.props.reason;
  }

  public getDate(): BusinessDate {
    return this.props.date;
  }

  public getCreatedBy(): string {
    return this.props.createdBy;
  }

  public getApprovedBy(): string {
    return this.props.approvedBy;
  }

  public getStatus(): DiscountStatus {
    return this.props.status;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public cancel(): void {
    this.props.status = "CANCELLED";
    this.props.updatedAt = new Date();
  }
}

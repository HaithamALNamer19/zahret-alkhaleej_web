import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Money } from "@/core/domain/value-objects/Money";

export type PaymentMethod = "CASH" | "TRANSFER";
export type PaymentStatus = "POSTED" | "CANCELLED";

export interface PaymentProps {
  id: string;
  paymentNumber: ReceiptNumber;
  companyId: string;
  amount: Money;
  paymentMethod: PaymentMethod;
  paymentDate: BusinessDate;
  notes?: string;
  receivedBy: string;
  status: PaymentStatus;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  public static create(
    props: Omit<PaymentProps, "status" | "createdAt" | "updatedAt">
  ): Payment {
    if (!props.amount.isPositive()) {
      throw new Error("قيمة الدفعة المالية يجب أن تكون أكبر من صفر.");
    }
    const now = new Date();
    return new Payment({
      ...props,
      notes: props.notes?.trim() || "",
      status: "POSTED",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: PaymentProps): Payment {
    return new Payment(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getPaymentNumber(): ReceiptNumber {
    return this.props.paymentNumber;
  }

  public getCompanyId(): string {
    return this.props.companyId;
  }

  public getAmount(): Money {
    return this.props.amount;
  }

  public getPaymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  public getPaymentDate(): BusinessDate {
    return this.props.paymentDate;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getReceivedBy(): string {
    return this.props.receivedBy;
  }

  public getStatus(): PaymentStatus {
    return this.props.status;
  }

  public getCancelledBy(): string | undefined {
    return this.props.cancelledBy;
  }

  public getCancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public cancel(cancelledBy: string, reason: string): void {
    if (this.props.status === "CANCELLED") {
      throw new Error("سند القبض ملغي مسبقاً.");
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error("يجب تحديد سبب إلغاء سند القبض.");
    }
    this.props.status = "CANCELLED";
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason.trim();
    this.props.updatedAt = new Date();
  }
}

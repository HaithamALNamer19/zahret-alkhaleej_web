import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";

export type OutboundReceiptStatus = "DRAFT" | "POSTED" | "CANCELLED";

export interface OutboundLine {
  id: string;
  fishItemId: string;
  fishSizeId: string;
  requestedWeight: Weight;
}

export interface OutboundReceiptProps {
  id: string;
  receiptNumber: ReceiptNumber;
  companyId: string;
  withdrawalDate: BusinessDate;
  lines: OutboundLine[];
  notes?: string;
  status: OutboundReceiptStatus;
  createdBy: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OutboundReceipt {
  private constructor(private readonly props: OutboundReceiptProps) {}

  public static create(
    props: Omit<OutboundReceiptProps, "status" | "createdAt" | "updatedAt">
  ): OutboundReceipt {
    if (!props.lines || props.lines.length === 0) {
      throw new Error("سند الصرف يجب أن يحتوي على بند واحد على الأقل.");
    }

    const now = new Date();
    return new OutboundReceipt({
      ...props,
      status: "POSTED",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: OutboundReceiptProps): OutboundReceipt {
    return new OutboundReceipt(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getReceiptNumber(): ReceiptNumber {
    return this.props.receiptNumber;
  }

  public getCompanyId(): string {
    return this.props.companyId;
  }

  public getWithdrawalDate(): BusinessDate {
    return this.props.withdrawalDate;
  }

  public getLines(): OutboundLine[] {
    return this.props.lines;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getStatus(): OutboundReceiptStatus {
    return this.props.status;
  }

  public getCreatedBy(): string {
    return this.props.createdBy;
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
      throw new Error("سند الصرف ملغي مسبقاً.");
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error("يجب تحديد سبب الإلغاء.");
    }
    this.props.status = "CANCELLED";
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason.trim();
    this.props.updatedAt = new Date();
  }
}

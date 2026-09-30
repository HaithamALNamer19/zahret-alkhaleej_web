import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";

export type ReceiptStatus = "DRAFT" | "POSTED" | "CANCELLED";

export interface InboundDistribution {
  warehouseId: string;
  weight: Weight;
}

export interface InboundLine {
  id: string;
  fishItemId: string;
  fishSizeId: string;
  totalWeight: Weight;
  distributions: InboundDistribution[];
}

export interface InboundReceiptProps {
  id: string;
  receiptNumber: ReceiptNumber;
  companyId: string;
  entryDate: BusinessDate;
  lines: InboundLine[];
  notes?: string;
  status: ReceiptStatus;
  createdBy: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InboundReceipt {
  private constructor(private readonly props: InboundReceiptProps) {}

  public static create(
    props: Omit<InboundReceiptProps, "status" | "createdAt" | "updatedAt">
  ): InboundReceipt {
    if (!props.lines || props.lines.length === 0) {
      throw new Error("سند الإدخال يجب أن يحتوي على صنف واحد على الأقل.");
    }

    // Validate that warehouse distributions equal the line total weight
    for (const line of props.lines) {
      let sumDist = Weight.zero();
      for (const dist of line.distributions) {
        sumDist = sumDist.add(dist.weight);
      }
      if (!sumDist.equals(line.totalWeight)) {
        throw new Error(
          `إجمالي توزيع المستودعات (${sumDist.toKilograms()} كجم) لا يطابق إجمالي وزن السطر (${line.totalWeight.toKilograms()} كجم)`
        );
      }
    }

    const now = new Date();
    return new InboundReceipt({
      ...props,
      status: "POSTED",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: InboundReceiptProps): InboundReceipt {
    return new InboundReceipt(props);
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

  public getEntryDate(): BusinessDate {
    return this.props.entryDate;
  }

  public getLines(): InboundLine[] {
    return this.props.lines;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getStatus(): ReceiptStatus {
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
      throw new Error("سند الإدخال ملغي مسبقاً.");
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

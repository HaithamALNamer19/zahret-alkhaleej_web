import { Weight } from "@/core/domain/value-objects/Weight";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";

export interface OutboundAllocationProps {
  id: string;
  outboundReceiptId: string;
  outboundLineId: string;
  lotId: string;
  stockLocationId: string;
  warehouseId: string;
  weight: Weight;
  withdrawalDate: BusinessDate;
  createdAt: Date;
}

export class OutboundAllocation {
  private constructor(private readonly props: OutboundAllocationProps) {}

  public static create(
    props: Omit<OutboundAllocationProps, "createdAt">
  ): OutboundAllocation {
    return new OutboundAllocation({
      ...props,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: OutboundAllocationProps): OutboundAllocation {
    return new OutboundAllocation(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getOutboundReceiptId(): string {
    return this.props.outboundReceiptId;
  }

  public getOutboundLineId(): string {
    return this.props.outboundLineId;
  }

  public getLotId(): string {
    return this.props.lotId;
  }

  public getStockLocationId(): string {
    return this.props.stockLocationId;
  }

  public getWarehouseId(): string {
    return this.props.warehouseId;
  }

  public getWeight(): Weight {
    return this.props.weight;
  }

  public getWithdrawalDate(): BusinessDate {
    return this.props.withdrawalDate;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }
}

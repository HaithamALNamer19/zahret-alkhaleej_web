import { Weight } from "@/core/domain/value-objects/Weight";

export interface StockLocationProps {
  id: string;
  lotId: string;
  warehouseId: string;
  remainingWeight: Weight;
  createdAt: Date;
  updatedAt: Date;
}

export class StockLocation {
  private constructor(private readonly props: StockLocationProps) {}

  public static create(
    props: Omit<StockLocationProps, "createdAt" | "updatedAt">
  ): StockLocation {
    const now = new Date();
    return new StockLocation({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: StockLocationProps): StockLocation {
    return new StockLocation(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getLotId(): string {
    return this.props.lotId;
  }

  public getWarehouseId(): string {
    return this.props.warehouseId;
  }

  public getRemainingWeight(): Weight {
    return this.props.remainingWeight;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public deduct(amount: Weight): void {
    if (amount.isGreaterThan(this.props.remainingWeight)) {
      throw new Error(
        `الكمية المراد سحبها (${amount.toKilograms()} كجم) تتجاوز المتوفر في هذا المستودع (${this.props.remainingWeight.toKilograms()} كجم)`
      );
    }
    this.props.remainingWeight = this.props.remainingWeight.subtract(amount);
    this.props.updatedAt = new Date();
  }

  public restore(amount: Weight): void {
    this.props.remainingWeight = this.props.remainingWeight.add(amount);
    this.props.updatedAt = new Date();
  }
}

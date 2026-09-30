import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";

export interface FishSizeProps {
  id: string;
  fishItemId: string;
  label: string;
  dailyRateOverride: DailyStorageRate | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FishSize {
  private constructor(private readonly props: FishSizeProps) {}

  public static create(
    props: Omit<FishSizeProps, "active" | "createdAt" | "updatedAt">
  ): FishSize {
    if (!props.label || props.label.trim().length === 0) {
      throw new Error("تسمية الحجم مطلوبة.");
    }
    const now = new Date();
    return new FishSize({
      ...props,
      label: props.label.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: FishSizeProps): FishSize {
    return new FishSize(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getFishItemId(): string {
    return this.props.fishItemId;
  }

  public getLabel(): string {
    return this.props.label;
  }

  public getDailyRateOverride(): DailyStorageRate | null {
    return this.props.dailyRateOverride;
  }

  public isActive(): boolean {
    return this.props.active;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateRateOverride(newRate: DailyStorageRate | null): void {
    this.props.dailyRateOverride = newRate;
    this.props.updatedAt = new Date();
  }

  public setActive(active: boolean): void {
    this.props.active = active;
    this.props.updatedAt = new Date();
  }
}

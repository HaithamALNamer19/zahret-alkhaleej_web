import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";

export interface FishItemProps {
  id: string;
  name: string;
  defaultDailyRate: DailyStorageRate;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FishItem {
  private constructor(private readonly props: FishItemProps) {}

  public static create(
    props: Omit<FishItemProps, "active" | "createdAt" | "updatedAt">
  ): FishItem {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("اسم الصيد مطلوب.");
    }
    const now = new Date();
    return new FishItem({
      ...props,
      name: props.name.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: FishItemProps): FishItem {
    return new FishItem(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getName(): string {
    return this.props.name;
  }

  public getDefaultDailyRate(): DailyStorageRate {
    return this.props.defaultDailyRate;
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

  public updateRate(newRate: DailyStorageRate): void {
    this.props.defaultDailyRate = newRate;
    this.props.updatedAt = new Date();
  }

  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("اسم الصيد مطلوب.");
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  public setActive(active: boolean): void {
    this.props.active = active;
    this.props.updatedAt = new Date();
  }
}

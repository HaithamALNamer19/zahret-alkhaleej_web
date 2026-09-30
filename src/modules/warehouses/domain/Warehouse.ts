export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface WarehouseProps {
  id: string;
  code: string;
  name: string;
  notes?: string;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Warehouse {
  private constructor(private readonly props: WarehouseProps) {}

  public static create(
    props: Omit<WarehouseProps, "status" | "createdAt" | "updatedAt">
  ): Warehouse {
    if (!props.code || props.code.trim().length === 0) {
      throw new Error("كود المستودع مطلوب.");
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("اسم المستودع مطلوب.");
    }

    const now = new Date();
    return new Warehouse({
      ...props,
      code: props.code.trim().toUpperCase(),
      name: props.name.trim(),
      notes: props.notes?.trim() || "",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getCode(): string {
    return this.props.code;
  }

  public getName(): string {
    return this.props.name;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getStatus(): WarehouseStatus {
    return this.props.status;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateDetails(name: string, notes?: string, status?: WarehouseStatus): void {
    if (!name || name.trim().length === 0) {
      throw new Error("اسم المستودع مطلوب.");
    }
    this.props.name = name.trim();
    if (notes !== undefined) this.props.notes = notes.trim();
    if (status) this.props.status = status;
    this.props.updatedAt = new Date();
  }
}

import { CompanyCode } from "@/core/domain/value-objects/CompanyCode";

export type CompanyStatus = "ACTIVE" | "INACTIVE";

export interface CompanyProps {
  id: string;
  code: CompanyCode;
  name: string;
  contactPerson: string;
  phone: string;
  notes?: string;
  status: CompanyStatus;
  withdrawalBlocked: boolean;
  withdrawalBlockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Company {
  private constructor(private readonly props: CompanyProps) {}

  public static create(
    props: Omit<CompanyProps, "status" | "withdrawalBlocked" | "createdAt" | "updatedAt">
  ): Company {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("اسم الشركة مطلوب ولا يمكن أن يكون فارغاً.");
    }
    const now = new Date();
    return new Company({
      ...props,
      name: props.name.trim(),
      contactPerson: props.contactPerson.trim(),
      phone: props.phone.trim(),
      notes: props.notes?.trim() || "",
      status: "ACTIVE",
      withdrawalBlocked: false,
      withdrawalBlockReason: undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: CompanyProps): Company {
    return new Company(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getCode(): CompanyCode {
    return this.props.code;
  }

  public getName(): string {
    return this.props.name;
  }

  public getContactPerson(): string {
    return this.props.contactPerson;
  }

  public getPhone(): string {
    return this.props.phone;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getStatus(): CompanyStatus {
    return this.props.status;
  }

  public isWithdrawalBlocked(): boolean {
    return this.props.withdrawalBlocked;
  }

  public getWithdrawalBlockReason(): string | undefined {
    return this.props.withdrawalBlockReason;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public blockWithdrawal(reason: string): void {
    this.props.withdrawalBlocked = true;
    this.props.withdrawalBlockReason = reason.trim();
    this.props.updatedAt = new Date();
  }

  public unblockWithdrawal(): void {
    this.props.withdrawalBlocked = false;
    this.props.withdrawalBlockReason = undefined;
    this.props.updatedAt = new Date();
  }

  public updateDetails(details: {
    name: string;
    contactPerson: string;
    phone: string;
    notes?: string;
    status: CompanyStatus;
  }): void {
    if (!details.name || details.name.trim().length === 0) {
      throw new Error("اسم الشركة مطلوب.");
    }
    this.props.name = details.name.trim();
    this.props.contactPerson = details.contactPerson.trim();
    this.props.phone = details.phone.trim();
    this.props.notes = details.notes?.trim() || "";
    this.props.status = details.status;
    this.props.updatedAt = new Date();
  }
}

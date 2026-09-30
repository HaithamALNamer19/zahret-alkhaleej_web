export interface SystemSettingsProps {
  companyDisplayName: string;
  defaultFreeDays: number;
  stageDays: number;
  doublingFactor: number;
  freePeriodWarningDays: number;
  defaultCurrency: string;
  paymentMethods: string[];
  updatedAt: Date;
}

export class SystemSettings {
  private constructor(private readonly props: SystemSettingsProps) {}

  public static default(): SystemSettings {
    return new SystemSettings({
      companyDisplayName: "زهرة المحيط لتصدير الأسماك (Ocean Flower)",
      defaultFreeDays: 15,
      stageDays: 30,
      doublingFactor: 2,
      freePeriodWarningDays: 2,
      defaultCurrency: "YER",
      paymentMethods: ["CASH", "TRANSFER"],
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: SystemSettingsProps): SystemSettings {
    return new SystemSettings(props);
  }

  public getCompanyDisplayName(): string {
    return this.props.companyDisplayName;
  }

  public getDefaultFreeDays(): number {
    return this.props.defaultFreeDays;
  }

  public getStageDays(): number {
    return this.props.stageDays;
  }

  public getDoublingFactor(): number {
    return this.props.doublingFactor;
  }

  public getFreePeriodWarningDays(): number {
    return this.props.freePeriodWarningDays;
  }

  public getDefaultCurrency(): string {
    return this.props.defaultCurrency;
  }

  public getPaymentMethods(): string[] {
    return this.props.paymentMethods;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public update(props: Partial<Omit<SystemSettingsProps, "updatedAt">>): void {
    if (props.companyDisplayName !== undefined) this.props.companyDisplayName = props.companyDisplayName;
    if (props.defaultFreeDays !== undefined) this.props.defaultFreeDays = props.defaultFreeDays;
    if (props.stageDays !== undefined) this.props.stageDays = props.stageDays;
    if (props.doublingFactor !== undefined) this.props.doublingFactor = props.doublingFactor;
    if (props.freePeriodWarningDays !== undefined) this.props.freePeriodWarningDays = props.freePeriodWarningDays;
    if (props.paymentMethods !== undefined) this.props.paymentMethods = props.paymentMethods;
    this.props.updatedAt = new Date();
  }
}

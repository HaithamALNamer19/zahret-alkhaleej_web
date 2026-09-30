import { DomainError } from "./DomainError";

export class InvalidPaymentAmountError extends DomainError {
  public readonly code = "INVALID_PAYMENT_AMOUNT";

  constructor(amountYer: number) {
    super(
      `Invalid payment amount: ${amountYer} YER`,
      `مبلغ الدفعة غير صالح (${amountYer} ر.ي). يجب أن يكون أكبر من الصفر.`
    );
  }
}

export class InvalidDiscountError extends DomainError {
  public readonly code = "INVALID_DISCOUNT";

  constructor(amountYer: number) {
    super(
      `Invalid discount amount: ${amountYer} YER`,
      `مبلغ الخصم غير صالح (${amountYer} ر.ي). يجب أن يكون أكبر من الصفر.`
    );
  }
}

import { DomainError } from "./DomainError";

export class InsufficientStockError extends DomainError {
  public readonly code = "INSUFFICIENT_STOCK";

  constructor(requestedKg: number, availableKg: number) {
    super(
      `Insufficient stock: requested ${requestedKg} KG, but only ${availableKg} KG available`,
      `الكمية المطلوبة غير متوفرة. الرصيد المتاح: ${availableKg.toLocaleString("ar-YE")} كجم.`
    );
  }
}

export class FifoViolationError extends DomainError {
  public readonly code = "FIFO_VIOLATION";

  constructor(attemptedLotNumber: string, olderLotNumber: string) {
    super(
      `FIFO violation: cannot allocate from lot ${attemptedLotNumber} while older lot ${olderLotNumber} has remaining stock`,
      `مخالفة لقاعدة FIFO: توجد دفعة أقدم (${olderLotNumber}) يجب صرفها أولاً قبل الدفعة (${attemptedLotNumber}).`
    );
  }
}

export class CompanyWithdrawalBlockedError extends DomainError {
  public readonly code = "COMPANY_WITHDRAWAL_BLOCKED";

  constructor(companyName: string, reason?: string) {
    super(
      `Company ${companyName} is blocked from withdrawals: ${reason || "Administrative block"}`,
      `عمليات الصرف موقوفة لشركة (${companyName})${reason ? `: ${reason}` : " بقرار إداري."}`
    );
  }
}

export class LotNotFoundError extends DomainError {
  public readonly code = "LOT_NOT_FOUND";

  constructor(lotIdOrNumber: string) {
    super(
      `Lot not found: ${lotIdOrNumber}`,
      `الدفعة المطلوبة غير موجودة في النظام: ${lotIdOrNumber}`
    );
  }
}

export class InvalidWarehouseAllocationError extends DomainError {
  public readonly code = "INVALID_WAREHOUSE_ALLOCATION";

  constructor(detail: string) {
    super(
      `Invalid warehouse allocation: ${detail}`,
      `توزيع غير صالح للمستودعات: ${detail}`
    );
  }
}

export class ConcurrentStockModificationError extends DomainError {
  public readonly code = "CONCURRENT_STOCK_MODIFICATION";

  constructor() {
    super(
      "Concurrent stock modification detected. Transaction aborted.",
      "تم تعديل رصيد المخزون بواسطة مستخدم آخر في نفس اللحظة. يرجى مراجعة الرصيد والمحاولة مرة أخرى."
    );
  }
}

export class BackdatedReplayConflictError extends DomainError {
  public readonly code = "BACKDATED_REPLAY_CONFLICT";

  constructor(detail: string) {
    super(
      `Backdated replay conflict: ${detail}`,
      `تعارض في إعادة بناء السجل الزمني للحركة بأثر رجعي: ${detail}`
    );
  }
}

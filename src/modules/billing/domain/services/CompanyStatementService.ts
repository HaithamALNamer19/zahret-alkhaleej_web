import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Money } from "@/core/domain/value-objects/Money";
import { StorageFeeCalculator } from "./StorageFeeCalculator";
import { Lot } from "@/modules/inventory/domain/Lot";
import { OutboundAllocation } from "@/modules/inventory/domain/OutboundAllocation";
import { Payment } from "@/modules/finance/domain/Payment";
import { Discount } from "@/modules/finance/domain/Discount";

export interface StatementEntry {
  date: BusinessDate;
  description: string;
  reference: string;
  type: "STORAGE_FEE" | "PAYMENT" | "DISCOUNT";
  debit: Money; // Storage Fees
  credit: Money; // Payments, Discounts
  runningBalance: Money;
}

export interface CompanyStatementSummary {
  companyId: string;
  asOfDate: BusinessDate;
  totalAccruedStorageFees: Money;
  totalPayments: Money;
  totalDiscounts: Money;
  netOutstandingBalance: Money; // Debit - Credit
  entries: StatementEntry[];
}

export class CompanyStatementService {
  /**
   * Generates a fully reconciled Financial Statement for a company up to asOfDate.
   * Synthesizes Virtual Storage Fee Entries per Lot segments alongside real Payments and Discounts.
   */
  public static generateStatement(params: {
    companyId: string;
    asOfDate: BusinessDate;
    lots: Lot[];
    allocationsByLotId: Map<string, OutboundAllocation[]>;
    payments: Payment[];
    discounts: Discount[];
  }): CompanyStatementSummary {
    const {
      companyId,
      asOfDate,
      lots,
      allocationsByLotId,
      payments,
      discounts,
    } = params;

    const rawEvents: {
      date: BusinessDate;
      description: string;
      reference: string;
      type: "STORAGE_FEE" | "PAYMENT" | "DISCOUNT";
      debit: Money;
      credit: Money;
    }[] = [];

    let totalFees = Money.zero();
    let totalPayments = Money.zero();
    let totalDiscounts = Money.zero();

    // 1. Generate Virtual Storage Fee Entries for each Lot
    for (const lot of lots) {
      if (lot.getStatus() === "CANCELLED") continue;
      if (lot.getEntryDate().isAfter(asOfDate)) continue;

      const lotAllocations = allocationsByLotId.get(lot.getId()) || [];
      const withdrawals = lotAllocations.map((a) => ({
        withdrawalDate: a.getWithdrawalDate(),
        withdrawnWeight: a.getWeight(),
      }));

      const feeResult = StorageFeeCalculator.calculate({
        entryDate: lot.getEntryDate(),
        asOfDate,
        originalWeight: lot.getOriginalWeight(),
        withdrawals,
        baseRate: lot.getBaseDailyRateSnapshot(),
        freeDays: lot.getFreeDaysSnapshot(),
        stageDays: lot.getStageDaysSnapshot(),
        doublingFactor: lot.getDoublingFactorSnapshot(),
      });

      if (feeResult.totalFee.isPositive()) {
        totalFees = totalFees.add(feeResult.totalFee);

        // Add virtual entries for each active segment that had charges
        for (const seg of feeResult.segments) {
          if (seg.segmentFee.isPositive()) {
            rawEvents.push({
              date: seg.endDate,
              description: `رسوم تخزين: ${lot.getFishNameSnapshot()} (${lot.getFishSizeSnapshot()}) - مرحلة ${seg.stage + 1} (مضاعف ×${seg.multiplier}) لمدة ${seg.daysCount} يوم`,
              reference: lot.getLotNumber().getValue(),
              type: "STORAGE_FEE",
              debit: seg.segmentFee,
              credit: Money.zero(),
            });
          }
        }
      }
    }

    // 2. Add Payments
    for (const payment of payments) {
      if (payment.getStatus() === "CANCELLED") continue;
      if (payment.getPaymentDate().isAfter(asOfDate)) continue;

      totalPayments = totalPayments.add(payment.getAmount());
      rawEvents.push({
        date: payment.getPaymentDate(),
        description: `سند قبض نقدي / تحويل (${payment.getPaymentMethod() === "CASH" ? "نقداً" : "تحويل بنكي"})`,
        reference: payment.getPaymentNumber().getValue(),
        type: "PAYMENT",
        debit: Money.zero(),
        credit: payment.getAmount(),
      });
    }

    // 3. Add Discounts
    for (const discount of discounts) {
      if (discount.getStatus() === "CANCELLED") continue;
      if (discount.getDate().isAfter(asOfDate)) continue;

      totalDiscounts = totalDiscounts.add(discount.getAmount());
      rawEvents.push({
        date: discount.getDate(),
        description: `خصم مالي معتمد: ${discount.getReason()}`,
        reference: discount.getDiscountNumber().getValue(),
        type: "DISCOUNT",
        debit: Money.zero(),
        credit: discount.getAmount(),
      });
    }

    // 4. Sort all events chronologically (date ASC)
    rawEvents.sort((a, b) => {
      if (a.date.isBefore(b.date)) return -1;
      if (a.date.isAfter(b.date)) return 1;
      // If same date: fees first, then payments/discounts
      if (a.type === "STORAGE_FEE" && b.type !== "STORAGE_FEE") return -1;
      if (a.type !== "STORAGE_FEE" && b.type === "STORAGE_FEE") return 1;
      return 0;
    });

    // 5. Compute Cumulative Running Balance
    let runningBalance = Money.zero();
    const finalEntries: StatementEntry[] = [];

    for (const ev of rawEvents) {
      runningBalance = runningBalance.add(ev.debit).subtract(ev.credit);
      finalEntries.push({
        date: ev.date,
        description: ev.description,
        reference: ev.reference,
        type: ev.type,
        debit: ev.debit,
        credit: ev.credit,
        runningBalance,
      });
    }

    const netOutstandingBalance = totalFees.subtract(totalPayments).subtract(totalDiscounts);

    return {
      companyId,
      asOfDate,
      totalAccruedStorageFees: totalFees,
      totalPayments,
      totalDiscounts,
      netOutstandingBalance,
      entries: finalEntries,
    };
  }
}

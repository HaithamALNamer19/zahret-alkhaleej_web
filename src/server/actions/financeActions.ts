"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@/modules/finance/domain/Payment";

export async function recordPaymentAction(data: {
  companyId: string;
  amountYer: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.recordPaymentUseCase.execute({
      ...data,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    revalidatePath("/finance/payments");
    revalidatePath(`/companies/${data.companyId}`);
    return {
      success: true,
      paymentId: res.getValue().getId(),
      paymentNumber: res.getValue().getPaymentNumber().getValue(),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function recordDiscountAction(data: {
  companyId: string;
  amountYer: number;
  reason: string;
  date: string;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.recordDiscountUseCase.execute({
      ...data,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    revalidatePath("/finance/discounts");
    revalidatePath(`/companies/${data.companyId}`);
    return {
      success: true,
      discountId: res.getValue().getId(),
      discountNumber: res.getValue().getDiscountNumber().getValue(),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function getCompanyStatementAction(companyId: string, asOfDate?: string) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.getCompanyStatementUseCase.execute({
      companyId,
      asOfDate,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    const val = res.getValue();
    return {
      success: true,
      data: {
        companyId: val.companyId,
        asOfDate: val.asOfDate.toString(),
        totalAccruedStorageFeesYer: val.totalAccruedStorageFees.toYer(),
        totalPaymentsYer: val.totalPayments.toYer(),
        totalDiscountsYer: val.totalDiscounts.toYer(),
        netOutstandingBalanceYer: val.netOutstandingBalance.toYer(),
        entries: val.entries.map((e) => ({
          date: e.date.toString(),
          dateArabic: e.date.formatArabic(),
          description: e.description,
          reference: e.reference,
          type: e.type,
          debitYer: e.debit.toYer(),
          creditYer: e.credit.toYer(),
          runningBalanceYer: e.runningBalance.toYer(),
        })),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

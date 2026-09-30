"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";

export async function requestFifoOverrideAction(data: {
  companyId: string;
  fishItemId: string;
  fishSizeId: string;
  requestedQuantityKg: number;
  normalAllocationDetails: string;
  requestedAlternativeDetails: string;
  reason: string;
}) {
  try {
    const user = await requireAuth();
    const res = await container.requestFifoOverrideUseCase.execute({
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

    revalidatePath("/approvals");
    return { success: true, requestId: res.getValue().getId() };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب",
    };
  }
}

export async function reviewApprovalAction(data: {
  approvalId: string;
  decision: "APPROVE" | "REJECT";
  comment?: string;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.reviewApprovalUseCase.execute({
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

    revalidatePath("/approvals");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء مراجعة الطلب",
    };
  }
}

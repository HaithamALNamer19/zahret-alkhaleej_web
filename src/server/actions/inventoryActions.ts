"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";

export async function createInboundReceiptAction(data: {
  companyId: string;
  entryDate: string;
  lines: {
    fishItemId: string;
    fishSizeId: string;
    totalWeightKg: number;
    distributions: {
      warehouseId: string;
      weightKg: number;
    }[];
  }[];
  notes?: string;
}) {
  try {
    const user = await requireAuth();
    const res = await container.createInboundReceiptUseCase.execute({
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

    revalidatePath("/inbound");
    revalidatePath("/inventory");
    return {
      success: true,
      receiptId: res.getValue().getId(),
      receiptNumber: res.getValue().getReceiptNumber().getValue(),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function previewFifoAllocationAction(data: {
  companyId: string;
  fishItemId: string;
  fishSizeId: string;
  requestedWeightKg: number;
}) {
  try {
    await requireAuth();
    const res = await container.previewOutboundFifoAllocationUseCase.execute(data);

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    return { success: true, data: res.getValue() };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function createOutboundReceiptAction(data: {
  companyId: string;
  withdrawalDate: string;
  lines: {
    fishItemId: string;
    fishSizeId: string;
    requestedWeightKg: number;
    userChoicesByLotId: {
      lotId: string;
      choices: {
        stockLocationId: string;
        warehouseId: string;
        weightKg: number;
      }[];
    }[];
  }[];
  notes?: string;
}) {
  try {
    const user = await requireAuth();
    const res = await container.createOutboundReceiptUseCase.execute({
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

    revalidatePath("/outbound");
    revalidatePath("/inventory");
    return {
      success: true,
      receiptId: res.getValue().getId(),
      receiptNumber: res.getValue().getReceiptNumber().getValue(),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function cancelOutboundReceiptAction(receiptId: string, reason: string) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.cancelOutboundReceiptUseCase.execute({
      receiptId,
      reason,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    revalidatePath(`/outbound/${receiptId}`);
    revalidatePath("/outbound");
    revalidatePath("/inventory");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء الإلغاء",
    };
  }
}

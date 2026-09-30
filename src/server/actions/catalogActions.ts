"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";

export async function createFishItemAction(data: {
  name: string;
  defaultDailyRateYer: number;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.createFishItemUseCase.execute({
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

    revalidatePath("/catalog");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function updateFishPriceAction(data: {
  fishItemId: string;
  newDailyRateYer: number;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.updateFishPriceUseCase.execute({
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

    revalidatePath("/catalog");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function createFishSizeAction(data: {
  fishItemId: string;
  label: string;
  dailyRateOverrideYer?: number | null;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.createFishSizeUseCase.execute({
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

    revalidatePath("/catalog");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

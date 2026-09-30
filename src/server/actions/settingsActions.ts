"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(data: {
  companyDisplayName: string;
  defaultFreeDays: number;
  stageDays: number;
  doublingFactor: number;
  freePeriodWarningDays: number;
}) {
  try {
    const user = await requireAuth(["GENERAL_MANAGER"]);
    const res = await container.updateSystemSettingsUseCase.execute({
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

    revalidatePath("/settings");
    revalidatePath("/");
    revalidatePath("/login");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حفظ الإعدادات",
    };
  }
}

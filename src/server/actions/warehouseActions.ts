"use server";

import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";

export async function createWarehouseAction(data: {
  code: string;
  name: string;
  notes?: string;
}) {
  try {
    const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);
    const res = await container.createWarehouseUseCase.execute({
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

    revalidatePath("/warehouses");
    return { success: true, warehouseId: res.getValue().getId() };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

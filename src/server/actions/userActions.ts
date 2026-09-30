"use server";

import { requireAuth, invalidateUserSessionCache } from "@/server/auth/session";
import { container } from "@/server/container";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/core/application/authorization/Role";

export async function createUserAction(data: {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}) {
  try {
    const user = await requireAuth(["GENERAL_MANAGER"]);
    const res = await container.createUserUseCase.execute({
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

    revalidatePath("/users");
    return { success: true, userId: res.getValue().getId() };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function disableUserAction(targetUserId: string) {
  try {
    const user = await requireAuth(["GENERAL_MANAGER"]);
    const res = await container.disableUserUseCase.execute({
      targetUserId,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    invalidateUserSessionCache(targetUserId);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function resetPasswordAction(targetUserId: string, newPassword: string) {
  try {
    const user = await requireAuth(["GENERAL_MANAGER"]);
    const res = await container.resetPasswordUseCase.execute({
      targetUserId,
      newPassword,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });

    if (res.isFailure()) {
      return { success: false, error: res.getError().message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

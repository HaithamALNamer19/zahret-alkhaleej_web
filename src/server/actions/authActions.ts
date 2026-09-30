"use server";

import { createSessionCookie, destroySessionCookie } from "@/server/auth/session";
import { adminAuth } from "@/core/infrastructure/firebase/admin";
import { container } from "@/server/container";

export async function loginAction(idToken: string) {
  try {
    if (!idToken) {
      return { success: false, error: "رمز المصادقة مفقود." };
    }

    // Verify token to ensure user is active in Firestore
    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await container.userRepository.findById(decoded.uid);
    if (!user) {
      return { success: false, error: "حساب المستخدم غير مسجل في ملفات النظام." };
    }

    if (!user.isActive()) {
      return { success: false, error: "تم إيقاف هذا الحساب. يرجى مراجعة الإدارة." };
    }

    await createSessionCookie(idToken);
    return { success: true, role: user.getRole() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل تسجيل الدخول.",
    };
  }
}

export async function logoutAction() {
  try {
    await destroySessionCookie();
    return { success: true };
  } catch (error) {
    return { success: false, error: "فشل تسجيل الخروج." };
  }
}

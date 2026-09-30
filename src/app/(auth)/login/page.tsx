"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/core/infrastructure/firebase/client";
import { loginAction } from "@/server/actions/authActions";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setError("يرجى إدخال اسم المستخدم.");
      return;
    }
    if (!password) {
      setError("يرجى إدخال كلمة المرور.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Synthesize internal domain email without exposing it to the user
      const domain = process.env.NEXT_PUBLIC_INTERNAL_AUTH_DOMAIN || "auth.zahratalkhaleej.local";
      const syntheticEmail = `${trimmedUsername}@${domain}`;

      // 2. Client-side authentication via Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(auth, syntheticEmail, password);
      const idToken = await userCredential.user.getIdToken();

      // 3. Send ID Token to Server Action to verify and create HttpOnly Session Cookie
      const serverRes = await loginAction(idToken);

      if (!serverRes.success) {
        setError(serverRes.error || "فشل تسجيل الدخول في النظام.");
        setIsLoading(false);
        return;
      }

      // 4. Redirect to Dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setIsLoading(false);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
      } else if (
        err.code === "auth/configuration-not-found" ||
        err.code === "auth/operation-not-allowed"
      ) {
        setError("خدمة المصادقة (Authentication) غير مفعلة في مشروع Firebase. يرجى تفعيل طريقة الدخول (Email/Password) من لوحة تحكم Firebase Console.");
      } else if (err.code === "auth/network-request-failed") {
        setError("تعذر الاتصال بخوادم Firebase. يرجى التحقق من اتصال الإنترنت.");
      } else {
        setError(err.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6 text-right">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
            ZK
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            نظام إدارة مستودعات زهرة الخليج
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            يرجى إدخال بيانات الدخول المعتمدة للوصول للنظام الداخلي
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم المستخدم"
            placeholder="مثال: ahmed أو manager"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoFocus
            dir="ltr"
            className="text-right"
          />

          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            dir="ltr"
            className="text-right"
          />

          <Button
            type="submit"
            className="w-full py-2.5 mt-2"
            isLoading={isLoading}
          >
            تسجيل الدخول
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-400 font-medium">
            شركة زهرة الخليج للصيد © 2026 - نظام محمي
          </span>
        </div>
      </div>
    </div>
  );
}

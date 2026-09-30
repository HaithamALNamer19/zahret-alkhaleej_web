"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/core/infrastructure/firebase/client";
import { loginAction } from "@/server/actions/authActions";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { OceanFlowerEmblem } from "@/shared/components/BrandLogo";
import {
  Snowflake,
  Boxes,
  ShieldCheck,
  Building2,
  Lock,
  User,
  ArrowRight,
  PhoneCall,
  MapPin,
} from "lucide-react";

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
      const domain =
        process.env.NEXT_PUBLIC_INTERNAL_AUTH_DOMAIN || "auth.zahratalkhaleej.local";
      const syntheticEmail = `${trimmedUsername}@${domain}`;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        syntheticEmail,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      const serverRes = await loginAction(idToken);

      if (!serverRes.success) {
        setError(serverRes.error || "فشل تسجيل الدخول في النظام.");
        setIsLoading(false);
        return;
      }

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
        setError(
          "خدمة المصادقة غير مفعلة في مشروع Firebase. يرجى تفعيل (Email/Password) من لوحة تحكم Firebase."
        );
      } else if (err.code === "auth/network-request-failed") {
        setError("تعذر الاتصال بخوادم Firebase. يرجى التحقق من اتصال الإنترنت.");
      } else {
        setError(err.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
      }
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800/40">
        {/* ========================================================== */}
        {/* COLUMN 1: CORPORATE MARITIME SHOWCASE (7 COLS)             */}
        {/* ========================================================== */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#061838] via-[#0b2e6b] to-[#071a3d] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Decorative Wave Background in SVG */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 800" fill="none">
              <path
                d="M-100 400 Q200 200 500 500 T1100 300"
                stroke="#60a5fa"
                strokeWidth="60"
                fill="none"
              />
              <path
                d="M-100 550 Q250 350 550 650 T1100 450"
                stroke="#dc2626"
                strokeWidth="30"
                fill="none"
              />
            </svg>
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <OceanFlowerEmblem size={56} showText={false} />
                <div className="absolute inset-0 rounded-full bg-blue-400/20 filter blur-sm -z-10" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight block">
                  <span className="text-[#f87171]">زهرة المحيط</span>{" "}
                  <span>لتصدير الأسماك</span>
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-blue-200 uppercase block">
                  Ocean Flower For Fishes Exporting
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium pt-2">
              نظام إدارة مستودعات التبريد وتخزين الأسماك لشركة زهرة المحيط. يتيح متابعة
              حركة المخزون، وسندات الاستلام والصرف، واحتساب رسوم التخزين وحسابات الشركات.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <Snowflake className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">
                  مستودعات التبريد والتجميد (سعة 1,150 طن)
                </strong>
                <span className="text-[11px] text-blue-200">
                  4 عنابر تبريد وتجميد بدرجات حرارة تصل إلى -35°م لحفظ الصيد المعد للتصدير.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">
                  الصرف بأقدمية الدخول (الوارد أولاً يخرج أولاً)
                </strong>
                <span className="text-[11px] text-blue-200">
                  تنظيم سحب البضاعة حسب تاريخ توريدها لضمان جودة الأسماك ودقة مدد التخزين.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">
                  سندات وفواتير رسمية معتمدة
                </strong>
                <span className="text-[11px] text-blue-200">
                  طباعة مباشرة لسندات التوريد والصرف وسندات القبض المالي بترويسة الشركة الرسمية.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Contact Details */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-blue-200 gap-2 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#f87171]" />
              <span>المكلا - حضرموت - الجمهورية اليمنية</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <PhoneCall className="w-3.5 h-3.5 text-blue-300" />
              <span dir="ltr">+967 5 388211 / ص.ب 62144</span>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* COLUMN 2: LOGIN TERMINAL (5 COLS)                           */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between text-right bg-white">
          <div>
            <div className="mb-6 space-y-1">
              <span className="text-[11px] font-bold text-[#0e3a82] block">
                مستودعات التبريد المركزية
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                تسجيل الدخول
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                أدخل اسم المستخدم وكلمة المرور الخاصة بك للوصول للنظام
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="اسم المستخدم"
                  placeholder="مثال: manager أو employee"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  dir="ltr"
                  className="text-right font-medium"
                />
              </div>

              <div>
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
              </div>

              <Button
                type="submit"
                className="w-full py-3 mt-3 bg-gradient-to-r from-[#0e3a82] to-[#124ca6] hover:from-[#0b2e6b] hover:to-[#0e3a82] text-white font-bold text-sm shadow-md cursor-pointer"
                isLoading={isLoading}
              >
                تسجيل الدخول
              </Button>
            </form>

            {/* Quick Demo Fill Buttons for Testing */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                حسابات تجريبية سريعة:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("manager", "Manager@123456")}
                  className="p-2 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-[#0e3a82] border border-blue-200 font-bold transition-all text-center cursor-pointer active:scale-95"
                >
                  مدير المستودع
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("employee", "Employee@123456")}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold transition-all text-center cursor-pointer active:scale-95"
                >
                  موظف مخزن
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">
              شركة زهرة المحيط لتصدير الأسماك © 2026 — المكلا، حضرموت
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


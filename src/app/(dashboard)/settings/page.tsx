import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { Card } from "@/shared/ui/Card";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  await requireAuth(["GENERAL_MANAGER"]);
  const settings = await container.settingsRepository.getSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إعدادات النظام العامة</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          إعدادات سياسة التخزين وحساب الرسوم والتنبيهات المعتمدة في شركة زهرة الخليج
        </p>
      </div>

      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
        <span>
          <strong>ملاحظة معمارية:</strong> الدفعات السابقة (Lots) تحتفظ بنسخة ثابتة (Snapshot) من قواعد التخزين عند إنشائها، وأي تعديل هنا يسري حصراً على الدفعات الجديدة مستقبلاً.
        </span>
      </div>

      <Card title="سياسة التخزين ومضاعفة الرسوم">
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">اسم الشركة الرسمي:</span>
              <span className="text-slate-400">يظهر في ترويسة التقارير والسندات الرسمية</span>
            </div>
            <span className="font-bold text-slate-900">{settings.getCompanyDisplayName()}</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">عدد الأيام المجانية الافتراضية:</span>
              <span className="text-slate-400">الفترة المجانية التي تمنح لكل دفعة فور دخولها</span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {settings.getDefaultFreeDays()} يوم
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">أيام المرحلة الواحدة:</span>
              <span className="text-slate-400">عدد الأيام التي يتضاعف السعر بعد انقضائها</span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {settings.getStageDays()} يوم
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">معامل التضاعف:</span>
              <span className="text-slate-400">معدل تضاعف السعر لكل مرحلة جديدة (مثال: 2x)</span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-sm">
              ×{settings.getDoublingFactor()}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">أيام الإنذار المسبق لانتهاء الفترة المجانية:</span>
              <span className="text-slate-400">إظهار التنبيه في لوحة التحكم قبل انتهاء المجاني</span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {settings.getFreePeriodWarningDays()} يوم
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">العملة الافتراضية للنظام:</span>
              <span className="text-slate-400">عملة تسعير رسوم التخزين وسندات القبض</span>
            </div>
            <span className="font-bold text-slate-900">الريال اليمني (YER)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

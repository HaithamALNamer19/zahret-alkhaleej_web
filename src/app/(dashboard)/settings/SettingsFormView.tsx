"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { updateSettingsAction } from "@/server/actions/settingsActions";
import { ShieldCheck, CheckCircle2, AlertCircle, Save, RotateCcw } from "lucide-react";

interface SettingsFormViewProps {
  initialSettings: {
    companyDisplayName: string;
    defaultFreeDays: number;
    stageDays: number;
    doublingFactor: number;
    freePeriodWarningDays: number;
    defaultCurrency: string;
    updatedAt: string;
  };
}

export const SettingsFormView: React.FC<SettingsFormViewProps> = ({ initialSettings }) => {
  const [companyDisplayName, setCompanyDisplayName] = useState(initialSettings.companyDisplayName);
  const [defaultFreeDays, setDefaultFreeDays] = useState(initialSettings.defaultFreeDays);
  const [stageDays, setStageDays] = useState(initialSettings.stageDays);
  const [doublingFactor, setDoublingFactor] = useState(initialSettings.doublingFactor);
  const [freePeriodWarningDays, setFreePeriodWarningDays] = useState(
    initialSettings.freePeriodWarningDays
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!companyDisplayName.trim()) {
      setError("يرجى إدخال اسم الشركة الرسمي.");
      return;
    }

    if (defaultFreeDays < 0 || defaultFreeDays > 180) {
      setError("عدد الأيام المجانية يجب أن يكون بين 0 و 180 يوماً.");
      return;
    }

    if (stageDays < 1 || stageDays > 365) {
      setError("أيام المرحلة الواحدة يجب أن تكون بين 1 و 365 يوماً.");
      return;
    }

    if (doublingFactor < 1 || doublingFactor > 5) {
      setError("معامل التضاعف يجب أن يكون بين 1 و 5.");
      return;
    }

    if (freePeriodWarningDays < 1 || freePeriodWarningDays > 30) {
      setError("أيام الإنذار المسبق يجب أن تكون بين 1 و 30 يوماً.");
      return;
    }

    setIsLoading(true);
    const res = await updateSettingsAction({
      companyDisplayName: companyDisplayName.trim(),
      defaultFreeDays: Number(defaultFreeDays),
      stageDays: Number(stageDays),
      doublingFactor: Number(doublingFactor),
      freePeriodWarningDays: Number(freePeriodWarningDays),
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل حفظ وتحديث الإعدادات.");
      return;
    }

    setSuccessMessage("تم حفظ وتحديث إعدادات النظام وسياسة التخزين بنجاح.");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleReset = () => {
    setCompanyDisplayName(initialSettings.companyDisplayName);
    setDefaultFreeDays(initialSettings.defaultFreeDays);
    setStageDays(initialSettings.stageDays);
    setDoublingFactor(initialSettings.doublingFactor);
    setFreePeriodWarningDays(initialSettings.freePeriodWarningDays);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
        <span className="leading-relaxed">
          <strong>تنبيه إداري:</strong> تعديل فترات السماح أو شروط مضاعفة الرسوم يطبّق تلقائياً على
          سندات الاستلام الجديدة فقط، بينما تستمر الدفعات المخزنة مسبقاً بنفس الشروط والأسعار التي
          دخلت بها لحفظ حقوق العملاء والمستودع.
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Card title="بيانات الشركة والترويسة الرسمية">
        <div className="space-y-4">
          <Input
            label="اسم الشركة الرسمي المعتمد *"
            value={companyDisplayName}
            onChange={(e) => setCompanyDisplayName(e.target.value)}
            placeholder="مثال: شركة زهرة الخليج للصيد والتصدير"
            required
          />
          <p className="text-[11px] text-slate-500">
            يظهر هذا الاسم في ترويسة جميع سندات الاستلام والصرف وسندات القبض المالي والتقارير المطبوعة.
          </p>
        </div>
      </Card>

      <Card title="سياسة التخزين واحتساب رسوم التبريد">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Input
              label="فترة السماح الافتراضية (بالأيام) *"
              type="number"
              min="0"
              max="180"
              value={defaultFreeDays}
              onChange={(e) => setDefaultFreeDays(Number(e.target.value))}
              dir="ltr"
              className="text-right font-mono"
              required
            />
            <span className="text-[11px] text-slate-400 block">
              عدد الأيام المجانية التي لا تحتسب عليها أي رسوم فور دخول الصيد (افتراضياً: 15 يوماً).
            </span>
          </div>

          <div className="space-y-1">
            <Input
              label="أيام المرحلة الواحدة (بالأيام) *"
              type="number"
              min="1"
              max="365"
              value={stageDays}
              onChange={(e) => setStageDays(Number(e.target.value))}
              dir="ltr"
              className="text-right font-mono"
              required
            />
            <span className="text-[11px] text-slate-400 block">
              المدة الزمنية لكل مرحلة، وبعد انقضائها يتضاعف سعر التخزين اليومي (افتراضياً: 30 يوماً).
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">معامل التضاعف *</label>
            <select
              value={doublingFactor}
              onChange={(e) => setDoublingFactor(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
            >
              <option value="1">بدون تضاعف (×1 - سعر ثابت)</option>
              <option value="2">مضاعفة عادية (×2 - يتضاعف كل مرحلة)</option>
              <option value="3">مضاعفة ثلاثية (×3)</option>
            </select>
            <span className="text-[11px] text-slate-400 block">
              معدل زيادة السعر مع كل مرحلة إضافية في المستودع.
            </span>
          </div>

          <div className="space-y-1">
            <Input
              label="أيام الإنذار المسبق لانتهاء فترة السماح *"
              type="number"
              min="1"
              max="30"
              value={freePeriodWarningDays}
              onChange={(e) => setFreePeriodWarningDays(Number(e.target.value))}
              dir="ltr"
              className="text-right font-mono"
              required
            />
            <span className="text-[11px] text-slate-400 block">
              إظهار إشعار وتنبيه في لوحة التحكم قبل انتهاء الأيام المجانية بدفعة الصيد.
            </span>
          </div>
        </div>
      </Card>

      <Card title="العملة الرسمية والمالية">
        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <span className="font-bold text-slate-800 block">العملة المعتمدة في النظام:</span>
            <span className="text-slate-400">
              تُحسب كافة أجور التخزين اليومية وسندات القبض المالي بالريال اليمني
            </span>
          </div>
          <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            الريال اليمني (YER)
          </span>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
          className="gap-2 text-slate-600 hover:text-slate-800"
        >
          <RotateCcw className="w-4 h-4" />
          <span>استعادة القيم السابقة</span>
        </Button>

        <Button
          type="submit"
          isLoading={isLoading}
          className="gap-2 px-6 py-2.5 font-bold shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات في الإعدادات</span>
        </Button>
      </div>
    </form>
  );
};

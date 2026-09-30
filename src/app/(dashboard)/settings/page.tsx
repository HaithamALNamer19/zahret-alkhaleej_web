import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { SettingsFormView } from "./SettingsFormView";

export default async function SettingsPage() {
  await requireAuth(["GENERAL_MANAGER"]);
  const settings = await container.settingsRepository.getSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إعدادات النظام وسياسة التخزين</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          إدارة سياسة التخزين، فترات السماح، شروط مضاعفة الرسوم، وبيانات الترويسة المعتمدة
        </p>
      </div>

      <SettingsFormView
        initialSettings={{
          companyDisplayName: settings.getCompanyDisplayName(),
          defaultFreeDays: settings.getDefaultFreeDays(),
          stageDays: settings.getStageDays(),
          doublingFactor: settings.getDoublingFactor(),
          freePeriodWarningDays: settings.getFreePeriodWarningDays(),
          defaultCurrency: settings.getDefaultCurrency(),
          updatedAt: settings.getUpdatedAt().toISOString(),
        }}
      />
    </div>
  );
}

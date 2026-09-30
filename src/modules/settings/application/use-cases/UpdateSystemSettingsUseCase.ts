import { SettingsRepository } from "../ports/SettingsRepository";
import { SystemSettings } from "../../domain/SystemSettings";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";

export interface UpdateSystemSettingsInput {
  companyDisplayName: string;
  defaultFreeDays: number;
  stageDays: number;
  doublingFactor: number;
  freePeriodWarningDays: number;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: UpdateSystemSettingsInput): Promise<Result<SystemSettings, Error>> {
    try {
      if (input.actor.role !== "GENERAL_MANAGER") {
        return Result.fail(new Error("صلاحية تعديل إعدادات النظام مقتصرة حصرياً على المدير العام."));
      }

      if (!input.companyDisplayName || input.companyDisplayName.trim().length === 0) {
        return Result.fail(new Error("يرجى إدخال اسم الشركة الرسمي."));
      }

      if (input.defaultFreeDays < 0 || input.defaultFreeDays > 180) {
        return Result.fail(new Error("عدد الأيام المجانية يجب أن يكون بين 0 و 180 يوماً."));
      }

      if (input.stageDays < 1 || input.stageDays > 365) {
        return Result.fail(new Error("أيام المرحلة الواحدة يجب أن تكون بين 1 و 365 يوماً."));
      }

      if (input.doublingFactor < 1 || input.doublingFactor > 5) {
        return Result.fail(new Error("معامل التضاعف يجب أن يكون بين 1 و 5."));
      }

      if (input.freePeriodWarningDays < 1 || input.freePeriodWarningDays > 30) {
        return Result.fail(new Error("أيام الإنذار المسبق يجب أن تكون بين 1 و 30 يوماً."));
      }

      const settings = await this.settingsRepository.getSettings();
      const before = {
        companyDisplayName: settings.getCompanyDisplayName(),
        defaultFreeDays: settings.getDefaultFreeDays(),
        stageDays: settings.getStageDays(),
        doublingFactor: settings.getDoublingFactor(),
        freePeriodWarningDays: settings.getFreePeriodWarningDays(),
      };

      settings.update({
        companyDisplayName: input.companyDisplayName.trim(),
        defaultFreeDays: Math.floor(input.defaultFreeDays),
        stageDays: Math.floor(input.stageDays),
        doublingFactor: Math.floor(input.doublingFactor),
        freePeriodWarningDays: Math.floor(input.freePeriodWarningDays),
      });

      await this.settingsRepository.saveSettings(settings);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "UPDATE_SYSTEM_SETTINGS",
        entityType: "SystemSettings",
        entityId: "system",
        reference: "SETTINGS",
        before,
        after: {
          companyDisplayName: settings.getCompanyDisplayName(),
          defaultFreeDays: settings.getDefaultFreeDays(),
          stageDays: settings.getStageDays(),
          doublingFactor: settings.getDoublingFactor(),
          freePeriodWarningDays: settings.getFreePeriodWarningDays(),
        },
        reason: "تحديث إعدادات النظام وسياسة التخزين ومضاعفة الرسوم",
      });

      return Result.ok(settings);
    } catch (err: any) {
      return Result.fail(err);
    }
  }
}

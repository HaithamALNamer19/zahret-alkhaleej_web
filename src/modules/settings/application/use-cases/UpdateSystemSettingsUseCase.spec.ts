import { describe, it, expect, vi } from "vitest";
import { UpdateSystemSettingsUseCase } from "./UpdateSystemSettingsUseCase";
import { SystemSettings } from "../../domain/SystemSettings";
import { SettingsRepository } from "../ports/SettingsRepository";
import { AuditLogger } from "@/core/application/ports/AuditLogger";

class InMemorySettingsRepository implements SettingsRepository {
  private settings = SystemSettings.default();

  public async getSettings(): Promise<SystemSettings> {
    return this.settings;
  }

  public async saveSettings(settings: SystemSettings): Promise<void> {
    this.settings = settings;
  }
}

describe("UpdateSystemSettingsUseCase", () => {
  const auditLoggerMock: AuditLogger = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  it("fails if actor is not GENERAL_MANAGER", async () => {
    const repo = new InMemorySettingsRepository();
    const useCase = new UpdateSystemSettingsUseCase(repo, auditLoggerMock);

    const res = await useCase.execute({
      companyDisplayName: "شركة زهرة الخليج",
      defaultFreeDays: 20,
      stageDays: 30,
      doublingFactor: 2,
      freePeriodWarningDays: 3,
      actor: {
        userId: "u1",
        name: "موظف مخزن",
        role: "EMPLOYEE",
      },
    });

    expect(res.isFailure()).toBe(true);
    expect(res.getError().message).toContain("المدير العام");
  });

  it("fails if days are out of reasonable business bounds", async () => {
    const repo = new InMemorySettingsRepository();
    const useCase = new UpdateSystemSettingsUseCase(repo, auditLoggerMock);

    const res = await useCase.execute({
      companyDisplayName: "شركة زهرة الخليج",
      defaultFreeDays: -5,
      stageDays: 30,
      doublingFactor: 2,
      freePeriodWarningDays: 3,
      actor: {
        userId: "admin",
        name: "المدير العام",
        role: "GENERAL_MANAGER",
      },
    });

    expect(res.isFailure()).toBe(true);
    expect(res.getError().message).toContain("الأيام المجانية");
  });

  it("updates settings successfully and logs audit entry", async () => {
    const repo = new InMemorySettingsRepository();
    const useCase = new UpdateSystemSettingsUseCase(repo, auditLoggerMock);

    const res = await useCase.execute({
      companyDisplayName: "شركة زهرة المحيط لتصدير الأسماك",
      defaultFreeDays: 20,
      stageDays: 45,
      doublingFactor: 2,
      freePeriodWarningDays: 5,
      actor: {
        userId: "admin",
        name: "المدير العام",
        role: "GENERAL_MANAGER",
      },
    });

    expect(res.isSuccess()).toBe(true);
    const updated = res.getValue();
    expect(updated.getCompanyDisplayName()).toBe("شركة زهرة المحيط لتصدير الأسماك");
    expect(updated.getDefaultFreeDays()).toBe(20);
    expect(updated.getStageDays()).toBe(45);
    expect(updated.getDoublingFactor()).toBe(2);
    expect(updated.getFreePeriodWarningDays()).toBe(5);

    expect(auditLoggerMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE_SYSTEM_SETTINGS",
        entityType: "SystemSettings",
      })
    );
  });
});

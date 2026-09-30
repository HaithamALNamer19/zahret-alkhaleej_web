import { SettingsRepository } from "../application/ports/SettingsRepository";
import { SystemSettings } from "../domain/SystemSettings";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseSettingsRepository implements SettingsRepository {
  private readonly docRef = adminFirestore.collection("settings").doc("system");

  public async getSettings(): Promise<SystemSettings> {
    const snap = await this.docRef.get();
    if (!snap.exists) {
      const defaultSettings = SystemSettings.default();
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }

    const data = snap.data()!;
    return SystemSettings.reconstitute({
      companyDisplayName: data.companyDisplayName || "شركة زهرة الخليج للصيد",
      defaultFreeDays: data.defaultFreeDays ?? 15,
      stageDays: data.stageDays ?? 30,
      doublingFactor: data.doublingFactor ?? 2,
      freePeriodWarningDays: data.freePeriodWarningDays ?? 2,
      defaultCurrency: data.defaultCurrency || "YER",
      paymentMethods: data.paymentMethods || ["CASH", "TRANSFER"],
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }

  public async saveSettings(settings: SystemSettings): Promise<void> {
    const data = {
      companyDisplayName: settings.getCompanyDisplayName(),
      defaultFreeDays: settings.getDefaultFreeDays(),
      stageDays: settings.getStageDays(),
      doublingFactor: settings.getDoublingFactor(),
      freePeriodWarningDays: settings.getFreePeriodWarningDays(),
      defaultCurrency: settings.getDefaultCurrency(),
      paymentMethods: settings.getPaymentMethods(),
      updatedAt: admin.firestore.Timestamp.fromDate(settings.getUpdatedAt()),
    };

    await this.docRef.set(data, { merge: true });
  }
}

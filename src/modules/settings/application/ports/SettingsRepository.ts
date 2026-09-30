import { SystemSettings } from "../../domain/SystemSettings";

export interface SettingsRepository {
  getSettings(): Promise<SystemSettings>;
  saveSettings(settings: SystemSettings): Promise<void>;
}

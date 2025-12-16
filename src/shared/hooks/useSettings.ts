import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  updatedAt: string;
}

export interface UseSettingsResult {
  settings: Setting[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  // 편의 메서드
  theme: string;
  setTheme: (theme: string) => Promise<void>;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  timerDefaultMinutes: number;
  setTimerDefaultMinutes: (minutes: number) => Promise<void>;
  notificationSound: boolean;
  setNotificationSound: (enabled: boolean) => Promise<void>;
  notificationVibration: boolean;
  setNotificationVibration: (enabled: boolean) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Setting[]>("get_all_settings");
      setSettings(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const getSetting = useCallback(async (key: string): Promise<string | null> => {
    const result = await invoke<string | null>("get_setting", { key });
    return result;
  }, []);

  const setSetting = useCallback(async (key: string, value: string): Promise<void> => {
    await invoke("set_setting", { key, value });
    await refresh();
  }, [refresh]);

  // 설정값 파싱 헬퍼
  const getSettingValue = useCallback((key: string, defaultValue: string): string => {
    const setting = settings.find(s => s.key === key);
    if (!setting?.value) return defaultValue;
    try {
      // JSON 문자열인 경우 파싱
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }, [settings]);

  const getSettingBool = useCallback((key: string, defaultValue: boolean): boolean => {
    const setting = settings.find(s => s.key === key);
    if (!setting?.value) return defaultValue;
    try {
      return JSON.parse(setting.value);
    } catch {
      return defaultValue;
    }
  }, [settings]);

  const getSettingNumber = useCallback((key: string, defaultValue: number): number => {
    const setting = settings.find(s => s.key === key);
    if (!setting?.value) return defaultValue;
    try {
      return Number(JSON.parse(setting.value));
    } catch {
      return defaultValue;
    }
  }, [settings]);

  // 편의 메서드들
  const theme = getSettingValue("theme", "system");
  const setTheme = useCallback(async (value: string) => {
    await setSetting("theme", JSON.stringify(value));
  }, [setSetting]);

  const language = getSettingValue("language", "ko");
  const setLanguage = useCallback(async (value: string) => {
    await setSetting("language", JSON.stringify(value));
  }, [setSetting]);

  const timerDefaultMinutes = getSettingNumber("timer_default_minutes", 5);
  const setTimerDefaultMinutes = useCallback(async (value: number) => {
    await setSetting("timer_default_minutes", String(value));
  }, [setSetting]);

  const notificationSound = getSettingBool("notification_sound", true);
  const setNotificationSound = useCallback(async (value: boolean) => {
    await setSetting("notification_sound", String(value));
  }, [setSetting]);

  const notificationVibration = getSettingBool("notification_vibration", true);
  const setNotificationVibration = useCallback(async (value: boolean) => {
    await setSetting("notification_vibration", String(value));
  }, [setSetting]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    settings,
    loading,
    error,
    refresh,
    getSetting,
    setSetting,
    theme,
    setTheme,
    language,
    setLanguage,
    timerDefaultMinutes,
    setTimerDefaultMinutes,
    notificationSound,
    setNotificationSound,
    notificationVibration,
    setNotificationVibration,
  };
}


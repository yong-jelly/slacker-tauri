/**
 * 위젯 위치 및 설정 저장/불러오기
 */

export interface WidgetSettings {
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  isMinimized: boolean;
}

const WIDGET_SETTINGS_KEY = "mirumi-widget-settings";

const defaultSettings: WidgetSettings = {
  position: { x: -1, y: -1 }, // -1은 기본 위치 사용
  size: { width: 320, height: 140 },
  opacity: 1,
  isMinimized: false,
};

/**
 * 위젯 설정 저장
 */
export const saveWidgetSettings = (settings: Partial<WidgetSettings>): void => {
  try {
    const currentSettings = loadWidgetSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error("Failed to save widget settings:", error);
  }
};

/**
 * 위젯 설정 불러오기
 */
export const loadWidgetSettings = (): WidgetSettings => {
  try {
    const saved = localStorage.getItem(WIDGET_SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error("Failed to load widget settings:", error);
  }
  return defaultSettings;
};

/**
 * 위젯 위치 저장
 */
export const saveWidgetPosition = (x: number, y: number): void => {
  saveWidgetSettings({ position: { x, y } });
};

/**
 * 위젯 크기 저장
 */
export const saveWidgetSize = (width: number, height: number): void => {
  saveWidgetSettings({ size: { width, height } });
};

/**
 * 위젯 투명도 저장
 */
export const saveWidgetOpacity = (opacity: number): void => {
  saveWidgetSettings({ opacity: Math.max(0.3, Math.min(1, opacity)) });
};

/**
 * 위젯 미니 모드 저장
 */
export const saveWidgetMinimized = (isMinimized: boolean): void => {
  saveWidgetSettings({ isMinimized });
};

/**
 * 위젯 설정 초기화
 */
export const resetWidgetSettings = (): void => {
  localStorage.removeItem(WIDGET_SETTINGS_KEY);
};


import { invoke } from "@tauri-apps/api/core";

/**
 * 시스템 트레이 타이틀 업데이트 (타이머 시간 표시)
 * @param title 표시할 타이틀 (예: "05:30")
 */
export const updateTrayTitle = async (title: string): Promise<void> => {
  try {
    await invoke("update_tray_title", { title });
  } catch (error) {
    console.error("Failed to update tray title:", error);
  }
};

/**
 * 타이머 시간을 트레이에 표시 형식으로 변환
 * @param seconds 남은 시간 (초)
 * @param taskTitle 태스크 이름 (선택)
 * @returns 표시할 문자열 (예: "피드백 기능 추가 05:30")
 */
export const formatTrayTime = (seconds: number, taskTitle?: string): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const time = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  
  if (taskTitle) {
    // 태스크 이름이 너무 길면 잘라내기 (트레이 공간 제한)
    const maxTitleLength = 15;
    const truncatedTitle = taskTitle.length > maxTitleLength 
      ? taskTitle.slice(0, maxTitleLength) + "…" 
      : taskTitle;
    return `${truncatedTitle} ${time}`;
  }
  return `⏱ ${time}`;
};

/**
 * 트레이 타이틀 초기화 (타이머 없을 때)
 */
export const clearTrayTitle = async (): Promise<void> => {
  try {
    await invoke("update_tray_title", { title: "Slacker" });
  } catch (error) {
    console.error("Failed to clear tray title:", error);
  }
};


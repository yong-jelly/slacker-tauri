import { invoke } from "@tauri-apps/api/core";

/**
 * 트레이 타이머 시작 (Play 시 호출)
 * @param remainingSecs 남은 시간 (초)
 * @param taskTitle 태스크 이름
 */
export const startTrayTimer = async (remainingSecs: number, taskTitle: string): Promise<void> => {
  try {
    await invoke("start_tray_timer", { remainingSecs, taskTitle });
  } catch (error) {
    console.error("Failed to start tray timer:", error);
  }
};

/**
 * 트레이 타이머 정지 (Pause/Stop 시 호출)
 * @param updateToSlacker 실행 중인 task가 없을 때 "Slacker"로 변경할지 여부 (기본값: false)
 * @returns 남은 시간 (초)
 */
export const stopTrayTimer = async (updateToSlacker: boolean = false): Promise<number> => {
  try {
    return await invoke("stop_tray_timer", { updateToSlacker }) as number;
  } catch (error) {
    console.error("Failed to stop tray timer:", error);
    return 0;
  }
};

/**
 * 현재 남은 시간 조회 (포그라운드 복귀 시)
 * @returns [남은 시간(초), 실행 중 여부]
 */
export const getRemainingTime = async (): Promise<[number, boolean]> => {
  try {
    return await invoke("get_remaining_time") as [number, boolean];
  } catch (error) {
    console.error("Failed to get remaining time:", error);
    return [0, false];
  }
};

/**
 * 트레이 타이머 시간 동기화 (시간 연장 시)
 * @param remainingSecs 새로운 남은 시간 (초)
 */
export const syncTrayTimer = async (remainingSecs: number): Promise<void> => {
  try {
    await invoke("sync_tray_timer", { remainingSecs });
  } catch (error) {
    console.error("Failed to sync tray timer:", error);
  }
};

/**
 * 트레이 타이머 업데이트 (다른 실행 중인 task로 전환 시)
 * @param remainingSecs 남은 시간 (초)
 * @param taskTitle 태스크 이름
 */
export const updateTrayTimer = async (remainingSecs: number, taskTitle: string): Promise<void> => {
  try {
    await invoke("update_tray_timer", { remainingSecs, taskTitle });
  } catch (error) {
    console.error("Failed to update tray timer:", error);
  }
};

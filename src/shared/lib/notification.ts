import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * 알림 권한 요청
 * @returns 권한이 부여되었는지 여부
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    return permissionGranted;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return false;
  }
};

/**
 * Task 완료 알림 전송
 * @param taskTitle 완료된 task 제목
 * @param duration 작업 시간 (분)
 */
export const sendTaskCompletedNotification = async (
  taskTitle: string,
  duration?: number
): Promise<void> => {
  try {
    const permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      console.warn("Notification permission not granted");
      return;
    }

    const body = duration
      ? `${duration}분 동안 작업을 완료했습니다! 🎉`
      : "작업을 완료했습니다! 🎉";

    sendNotification({
      title: `✅ ${taskTitle}`,
      body,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

/**
 * 타이머 종료 알림 전송
 * @param taskTitle task 제목
 */
export const sendTimerEndedNotification = async (
  taskTitle: string
): Promise<void> => {
  try {
    const permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      console.warn("Notification permission not granted");
      return;
    }

    sendNotification({
      title: `⏰ 시간 종료!`,
      body: `"${taskTitle}" 작업 시간이 종료되었습니다.`,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

/**
 * 일반 알림 전송
 * @param title 알림 제목
 * @param body 알림 내용
 */
export const sendNotificationMessage = async (
  title: string,
  body: string
): Promise<void> => {
  try {
    const permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      console.warn("Notification permission not granted");
      return;
    }

    sendNotification({ title, body });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};


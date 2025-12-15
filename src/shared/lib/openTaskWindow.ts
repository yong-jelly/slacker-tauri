import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Task } from "@entities/task";

export const openTaskWindow = async (task: Task): Promise<WebviewWindow | null> => {
  try {
    const label = `task-${task.id}`;

    // 이미 같은 작업의 창이 열려있는지 확인
    const existingWindow = await WebviewWindow.getByLabel(label);
    if (existingWindow) {
      await existingWindow.setFocus();
      return existingWindow;
    }

    // 메인 창의 위치와 크기 정보 가져오기
    const mainWindow = getCurrentWebviewWindow();
    const mainPosition = await mainWindow.outerPosition();
    const mainSize = await mainWindow.outerSize();

    // 메인 창 오른쪽에 배치
    const popupWidth = 800;
    const popupHeight = 200;
    const x = mainPosition.x + mainSize.width + 10;
    const y = mainPosition.y;

    // 외부 독립 팝업 창 생성
    const webview = new WebviewWindow(label, {
      url: `${window.location.origin}#/task/${task.id}`,
      title: task.title,
      width: popupWidth,
      height: popupHeight,
      x,
      y,
      resizable: true,
      decorations: true,
      transparent: false,
      skipTaskbar: false,
      alwaysOnTop: false,
    });

    return webview;
  } catch (error) {
    console.error("Failed to open task window:", error);
    return null;
  }
};


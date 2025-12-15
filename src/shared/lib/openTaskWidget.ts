import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Task, TaskStatus } from "@entities/task";
import { emit } from "@tauri-apps/api/event";
import { loadWidgetSettings } from "./widgetStorage";

const WIDGET_LABEL = "task-widget";

export const openTaskWidget = async (task: Task | null): Promise<WebviewWindow | null> => {
  try {
    console.log("openTaskWidget called", { task: task ? { id: task.id, title: task.title, status: task.status } : null });
    // 진행 중인 task가 없으면 위젯을 열지 않음
    if (!task || task.status !== TaskStatus.IN_PROGRESS) {
      console.log("openTaskWidget: No task or not in progress, closing widget");
      await closeTaskWidget();
      return null;
    }

    // 이미 위젯 창이 열려있는지 확인
    const existingWindow = await WebviewWindow.getByLabel(WIDGET_LABEL);
    if (existingWindow) {
      // task 정보 업데이트
      await emit("task-widget-update", task);
      await existingWindow.setFocus();
      return existingWindow;
    }

    // 저장된 위젯 설정 불러오기
    const settings = loadWidgetSettings();

    // 메인 창 위치 및 크기 가져오기
    const mainWindow = getCurrentWebviewWindow();
    const mainPosition = await mainWindow.outerPosition();
    const mainSize = await mainWindow.outerSize();

    // 미니 모드일 경우 작은 크기 사용
    const widgetWidth = settings.isMinimized ? 160 : settings.size.width;
    const widgetHeight = settings.isMinimized ? 50 : settings.size.height;
    
    // 저장된 위치가 있으면 사용, 없으면 메인 창 우측 상단에 배치
    const x = settings.position.x >= 0 ? settings.position.x : mainPosition.x + mainSize.width + 10;
    const y = settings.position.y >= 0 ? settings.position.y : mainPosition.y;

    // task 정보를 localStorage에 저장 (위젯 페이지에서 읽기 위해)
    // 위젯 창이 생성되기 전에 저장하여 race condition 방지
    localStorage.setItem(`task-${task.id}`, JSON.stringify(task));

    console.log("openTaskWidget: Creating widget window", { url: `${window.location.origin}#/widget?taskId=${task.id}`, x, y, width: widgetWidth, height: widgetHeight });

    // 항상 위에 표시되는 위젯 창 생성
    // 투명 창은 macOS에서 문제가 있을 수 있으므로 false로 설정
    const webview = new WebviewWindow(WIDGET_LABEL, {
      url: `${window.location.origin}#/widget?taskId=${task.id}`,
      title: "Task Widget",
      width: widgetWidth,
      height: widgetHeight,
      x,
      y,
      resizable: false,
      decorations: false,
      transparent: false, // 투명 창 비활성화 (macOS 호환성)
      skipTaskbar: true,
      alwaysOnTop: true,
      focus: true, // 생성 시 포커스를 주어 확인
      visible: true,
    });

    // 위젯 창 이벤트 리스너
    webview.once("tauri://created", async () => {
      console.log("openTaskWidget: Widget window created");
      try {
        await emit("task-widget-update", task);
        console.log("openTaskWidget: Task update event emitted");
      } catch (error) {
        console.error("Failed to emit task update:", error);
      }
    });

    webview.once("tauri://error", (error) => {
      console.error("openTaskWidget: Window creation error", error);
    });

    return webview;
  } catch (error) {
    console.error("Failed to open task widget:", error);
    return null;
  }
};

export const closeTaskWidget = async (): Promise<boolean> => {
  try {
    const existingWindow = await WebviewWindow.getByLabel(WIDGET_LABEL);
    if (existingWindow) {
      await existingWindow.close();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to close task widget:", error);
    return false;
  }
};

export const isTaskWidgetOpen = async (): Promise<boolean> => {
  try {
    const existingWindow = await WebviewWindow.getByLabel(WIDGET_LABEL);
    return existingWindow !== null;
  } catch (error) {
    return false;
  }
};


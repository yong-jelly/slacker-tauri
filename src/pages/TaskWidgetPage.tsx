import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Task, TaskStatus } from "@entities/task";
import { TaskWidget } from "@widgets/taskWidget/TaskWidget";

export const TaskWidgetPage = () => {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log("TaskWidgetPage: Component mounted", { taskId, location: window.location.href });
  }, []);

  // task 데이터 파싱 헬퍼 함수
  const parseTask = (taskData: string): Task | null => {
    try {
      const task = JSON.parse(taskData);
      // Date 객체 복원
      if (task.createdAt) task.createdAt = new Date(task.createdAt);
      if (task.completedAt) task.completedAt = new Date(task.completedAt);
      if (task.lastPausedAt) task.lastPausedAt = new Date(task.lastPausedAt);
      if (task.lastRunAt) task.lastRunAt = new Date(task.lastRunAt);
      if (task.targetDate) task.targetDate = new Date(task.targetDate);
      if (task.memos) {
        task.memos = task.memos.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
      }
      if (task.notes) {
        task.notes = task.notes.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }
      if (task.runHistory) {
        task.runHistory = task.runHistory.map((h: any) => ({
          ...h,
          startedAt: new Date(h.startedAt),
          endedAt: h.endedAt ? new Date(h.endedAt) : undefined,
        }));
      }
      if (task.timeExtensions) {
        task.timeExtensions = task.timeExtensions.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
      }
      return task;
    } catch (error) {
      console.error("Failed to parse task data:", error);
      return null;
    }
  };

  // localStorage에서 task 로드
  const loadTask = () => {
    if (taskId) {
      const taskData = localStorage.getItem(`task-${taskId}`);
      console.log("TaskWidgetPage: Loading task", { taskId, taskData: taskData ? "exists" : "not found" });
      if (taskData) {
        const task = parseTask(taskData);
        if (task) {
          console.log("TaskWidgetPage: Task loaded", task);
          setCurrentTask(task);
        }
      } else {
        console.warn("TaskWidgetPage: Task data not found in localStorage", taskId);
      }
    } else {
      console.warn("TaskWidgetPage: No taskId in URL");
    }
  };

  useEffect(() => {
    // 초기 로드 (약간의 지연을 두어 localStorage에 데이터가 저장될 시간을 줌)
    const initialLoad = setTimeout(() => {
      loadTask();
    }, 100);

    // Tauri 이벤트를 통해 task 업데이트 받기
    const setupEventListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlisten = await listen<Task>("task-widget-update", (event) => {
          setCurrentTask(event.payload);
          // localStorage도 업데이트
          if (taskId) {
            localStorage.setItem(`task-${taskId}`, JSON.stringify(event.payload));
          }
        });
        return unlisten;
      } catch (error) {
        console.error("Failed to setup event listener:", error);
      }
    };

    // 주기적으로 localStorage 확인 (이벤트가 작동하지 않을 경우 대비)
    const interval = setInterval(() => {
      loadTask();
    }, 1000);

    const cleanup = setupEventListener();
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
      cleanup.then((unlisten) => unlisten?.());
    };
  }, [taskId]);

  // 진행 중인 task가 없으면 위젯 숨기기 (하지만 위젯 페이지는 항상 렌더링)
  useEffect(() => {
    const updateVisibility = async () => {
      try {
        const window = getCurrentWebviewWindow();
        if (!currentTask || currentTask.status !== TaskStatus.IN_PROGRESS) {
          // 위젯을 숨기지 않고 로딩 메시지를 표시
          console.log("TaskWidgetPage: Task not ready, showing loading");
        } else {
          await window.show();
          console.log("TaskWidgetPage: Task ready, showing widget");
        }
      } catch (error) {
        console.error("TaskWidgetPage: Failed to update visibility", error);
      }
    };

    updateVisibility();
  }, [currentTask]);

  if (!isMounted) {
    return (
      <div className="w-screen h-screen bg-[#1C1E22] flex items-center justify-center">
        <div className="text-white">위젯 초기화 중...</div>
      </div>
    );
  }

  if (!currentTask || currentTask.status !== TaskStatus.IN_PROGRESS) {
    console.log("TaskWidgetPage: No task or not in progress", { currentTask, status: currentTask?.status, taskId });
    return (
      <div className="w-screen h-screen bg-[#1C1E22] flex flex-col items-center justify-center p-4">
        <div className="text-white text-sm text-center">
          <div className="font-semibold mb-2">위젯 로딩 중...</div>
          <div className="text-xs opacity-70">Task ID: {taskId || "없음"}</div>
          <div className="text-xs opacity-50 mt-2">위젯 창이 보이면 정상입니다</div>
        </div>
      </div>
    );
  }

  console.log("TaskWidgetPage: Rendering widget", currentTask);

  return (
    <div className="w-screen h-screen bg-[#1C1E22] p-2">
      <TaskWidget task={currentTask} />
    </div>
  );
};


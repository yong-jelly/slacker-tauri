import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { TaskStatus, TimeExtensionHistory } from "@entities/task";
import { getUrgencyLevel, getUrgencyColors, type UrgencyLevel, type UrgencyColors } from "../lib/urgency";
import { startTrayTimer, stopTrayTimer, getRemainingTime, syncTrayTimer } from "@shared/lib/tray";
import { sendTimerEndedNotification } from "@shared/lib/notification";

interface UseTaskTimerProps {
  expectedDuration: number;
  defaultDuration?: number;
  isInProgress: boolean;
  taskTitle?: string;
  onStatusChange?: (status: TaskStatus) => void;
  onExtendTime?: (extension: TimeExtensionHistory) => void;
  onTimerEnd?: () => void;
}

interface UseTaskTimerReturn {
  /** 남은 시간 (밀리초 단위) */
  remainingTimeMs: number;
  /** 남은 시간 (초 단위) */
  remainingTimeSeconds: number;
  isRunning: boolean;
  progress: number;
  completedProgress: number;
  urgencyLevel: UrgencyLevel;
  urgencyColors: UrgencyColors;
  handlePlay: (e: React.MouseEvent) => void;
  handlePause: (e: React.MouseEvent) => void;
  handleQuickExtendTime: (e: React.MouseEvent, minutes: number) => void;
  extendRemainingTime: (minutes: number) => void;
}

export const useTaskTimer = ({
  expectedDuration,
  defaultDuration,
  isInProgress,
  taskTitle,
  onStatusChange,
  onExtendTime,
  onTimerEnd,
}: UseTaskTimerProps): UseTaskTimerReturn => {
  const expectedDurationMs = expectedDuration * 60 * 1000;
  const timerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDurationMs;

  const [remainingTimeMs, setRemainingTimeMs] = useState(timerDurationMs);
  const [isRunning, setIsRunning] = useState(isInProgress);
  const timerEndedRef = useRef(false);

  // 초 단위
  const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);

  const progress = useMemo(
    () => remainingTimeMs / timerDurationMs,
    [remainingTimeMs, timerDurationMs]
  );

  const completedProgress = useMemo(() => 1 - progress, [progress]);
  const urgencyLevel = useMemo(() => getUrgencyLevel(progress), [progress]);
  const urgencyColors = useMemo(() => getUrgencyColors(urgencyLevel), [urgencyLevel]);

  // Rust 타이머 종료 이벤트 수신
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen("timer-ended", () => {
        if (taskTitle) {
          sendTimerEndedNotification(taskTitle);
        }
        onTimerEnd?.();
        setRemainingTimeMs(0);
        setIsRunning(false);
      });
      return unlisten;
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then((unlisten) => unlisten());
    };
  }, [taskTitle, onTimerEnd]);

  // 창이 포그라운드로 돌아올 때 Rust 타이머와 동기화
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isRunning) {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          setRemainingTimeMs(remainingSecs * 1000);
        } else {
          // Rust 타이머가 멈춰있으면 (0이 되었을 수 있음)
          setIsRunning(false);
          setRemainingTimeMs(remainingSecs * 1000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  // 타이머 종료 처리
  useEffect(() => {
    if (remainingTimeMs === 0 && isRunning && !timerEndedRef.current) {
      timerEndedRef.current = true;
      setIsRunning(false);
      stopTrayTimer();
    }
    if (remainingTimeMs > 0) {
      timerEndedRef.current = false;
    }
  }, [remainingTimeMs, isRunning]);

  // 10ms 간격으로 UI 타이머 업데이트 (포그라운드일 때만)
  useEffect(() => {
    if (!isRunning || remainingTimeMs <= 0) return;

    const timer = setInterval(() => {
      setRemainingTimeMs((prev) => Math.max(0, prev - 10));
    }, 10);

    return () => clearInterval(timer);
  }, [isRunning, remainingTimeMs]);

  useEffect(() => {
    setIsRunning(isInProgress);
  }, [isInProgress]);

  const handlePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      let newRemainingMs = remainingTimeMs;
      if (remainingTimeMs === 0) {
        newRemainingMs = timerDurationMs;
        setRemainingTimeMs(timerDurationMs);
      }
      
      setIsRunning(true);
      // Rust 트레이 타이머 시작
      await startTrayTimer(Math.ceil(newRemainingMs / 1000), taskTitle || "");
      onStatusChange?.(TaskStatus.IN_PROGRESS);
    },
    [onStatusChange, remainingTimeMs, timerDurationMs, taskTitle]
  );

  const handlePause = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      // Rust 트레이 타이머 정지
      await stopTrayTimer();
      onStatusChange?.(TaskStatus.PAUSED);
    },
    [onStatusChange]
  );

  const handleQuickExtendTime = useCallback(
    async (e: React.MouseEvent, minutes: number) => {
      e.stopPropagation();
      const extension: TimeExtensionHistory = {
        id: crypto.randomUUID(),
        addedMinutes: minutes,
        previousDuration: expectedDuration,
        newDuration: expectedDuration + minutes,
        createdAt: new Date(),
      };
      onExtendTime?.(extension);
      
      const extendMs = minutes * 60 * 1000;
      const newRemainingMs = remainingTimeMs + extendMs;
      setRemainingTimeMs(newRemainingMs);
      
      // Rust 트레이 타이머 동기화
      if (isRunning) {
        await syncTrayTimer(Math.ceil(newRemainingMs / 1000));
      }
    },
    [expectedDuration, onExtendTime, isRunning, remainingTimeMs]
  );

  const extendRemainingTime = useCallback(async (minutes: number) => {
    const extendMs = minutes * 60 * 1000;
    const newRemainingMs = remainingTimeMs + extendMs;
    setRemainingTimeMs(newRemainingMs);
    
    if (isRunning) {
      await syncTrayTimer(Math.ceil(newRemainingMs / 1000));
    }
  }, [isRunning, remainingTimeMs]);

  return {
    remainingTimeMs,
    remainingTimeSeconds,
    isRunning,
    progress,
    completedProgress,
    urgencyLevel,
    urgencyColors,
    handlePlay,
    handlePause,
    handleQuickExtendTime,
    extendRemainingTime,
  };
};

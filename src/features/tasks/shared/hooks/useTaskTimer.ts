import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TaskStatus, TimeExtensionHistory } from "@entities/task";
import { getUrgencyLevel, getUrgencyColors, type UrgencyLevel, type UrgencyColors } from "../lib/urgency";
import { updateTrayTitle, formatTrayTime, clearTrayTitle } from "@shared/lib/tray";
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
  /** 남은 시간 (초 단위, 트레이/일시정지 표시용) */
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
  const lastTrayUpdateRef = useRef(0);

  // 초 단위 (트레이/일시정지 표시용)
  const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);

  const progress = useMemo(
    () => remainingTimeMs / timerDurationMs,
    [remainingTimeMs, timerDurationMs]
  );

  const completedProgress = useMemo(() => 1 - progress, [progress]);

  const urgencyLevel = useMemo(() => getUrgencyLevel(progress), [progress]);
  const urgencyColors = useMemo(() => getUrgencyColors(urgencyLevel), [urgencyLevel]);

  // 트레이 타이틀 업데이트 (초 단위로만 업데이트하여 성능 최적화)
  useEffect(() => {
    const currentSeconds = Math.ceil(remainingTimeMs / 1000);
    if (isRunning && remainingTimeMs > 0 && currentSeconds !== lastTrayUpdateRef.current) {
      lastTrayUpdateRef.current = currentSeconds;
      updateTrayTitle(formatTrayTime(currentSeconds, taskTitle));
    } else if (!isRunning) {
      clearTrayTitle();
    }
  }, [remainingTimeMs, isRunning]);

  // 타이머 종료 시 알림
  useEffect(() => {
    if (remainingTimeMs === 0 && isRunning && !timerEndedRef.current) {
      timerEndedRef.current = true;
      if (taskTitle) {
        sendTimerEndedNotification(taskTitle);
      }
      onTimerEnd?.();
      clearTrayTitle();
    }
    // 타이머가 다시 시작되면 플래그 초기화
    if (remainingTimeMs > 0) {
      timerEndedRef.current = false;
    }
  }, [remainingTimeMs, isRunning, taskTitle, onTimerEnd]);

  // 10ms 간격으로 타이머 업데이트 (100분의 1초)
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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(true);
      if (remainingTimeMs === 0) {
        setRemainingTimeMs(timerDurationMs);
      }
      onStatusChange?.(TaskStatus.IN_PROGRESS);
    },
    [onStatusChange, remainingTimeMs, timerDurationMs]
  );

  const handlePause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      onStatusChange?.(TaskStatus.PAUSED);
    },
    [onStatusChange]
  );

  const handleQuickExtendTime = useCallback(
    (e: React.MouseEvent, minutes: number) => {
      e.stopPropagation();
      const extension: TimeExtensionHistory = {
        id: crypto.randomUUID(),
        addedMinutes: minutes,
        previousDuration: expectedDuration,
        newDuration: expectedDuration + minutes,
        createdAt: new Date(),
      };
      onExtendTime?.(extension);
      setRemainingTimeMs((prev) => prev + minutes * 60 * 1000);
    },
    [expectedDuration, onExtendTime]
  );

  const extendRemainingTime = useCallback((minutes: number) => {
    setRemainingTimeMs((prev) => prev + minutes * 60 * 1000);
  }, []);

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

